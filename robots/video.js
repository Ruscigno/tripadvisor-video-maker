const gm = require("gm").subClass({ imageMagick: true });
const state = require("./state.js");
const spawn = require("child_process").spawn;
const path = require("path");
const os = require("os");
const rootPath = path.resolve(__dirname, "..");

const fromRoot = (relPath) => path.resolve(rootPath, relPath);

async function robot() {
  console.log("> [video-robot] Starting...");
  const content = state.load();

  await convertAllImages(content);
  await createAllSentenceImages(content);
  await createYouTubeThumbnail();
  await createAfterEffectsScript(content);
  await renderVideoWithAfterEffects();

  state.save(content);

  async function convertAllImages(content) {
    content.convertedImages = [];
    for (let i = 0; i < content.downloadedImages.length; i++) {
        const inputFile = fromRoot(content.downloadedImages[i]);
        const outputFile = inputFile.replace('original', 'converted')
        content.convertedImages[i] = outputFile;
        await convertImage(inputFile, outputFile);
    }
  }

  async function convertImage(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
      const width = 1920;
      const height = 1080;

      gm()
        .in(inputFile)
        .out("(")
        .out("-clone")
        .out("0")
        .out("-background", "white")
        .out("-blur", "0x9")
        .out("-resize", `${width}x${height}^`)
        .out(")")
        .out("(")
        .out("-clone")
        .out("0")
        .out("-background", "white")
        .out("-resize", `${width}x${height}`)
        .out(")")
        .out("-delete", "0")
        .out("-gravity", "center")
        .out("-compose", "over")
        .out("-composite")
        .out("-extent", `${width}x${height}`)
        .write(outputFile, (error) => {
          if (error) {
            return reject(error);
          }

          console.log(`> [video-robot] Image converted: ${outputFile}`);
          resolve();
        });
    });
  }

  async function createAllSentenceImages(content) {
    let imageIndex = 0;
    for (let i = 0; i < content.sentences.length; i++
    ) {
      await createSentenceImage(fromRoot(content.sentenceImages[imageIndex]), i, content.sentences[i].text);
      imageIndex++;
      if (imageIndex >= content.sentenceImages.length) {
        imageIndex = 0;
      }
    }
  }

  async function createSentenceImage(outputFile, index, text) {
    return new Promise((resolve, reject) => {
      const templateSettings = {
        0: {
          size: "1920x400",
          gravity: "center",
        },
        1: {
          size: "1920x1080",
          gravity: "center",
        },
        2: {
          size: "800x1080",
          gravity: "west",
        },
        3: {
          size: "1920x400",
          gravity: "center",
        },
        4: {
          size: "1920x1080",
          gravity: "center",
        },
        5: {
          size: "800x1080",
          gravity: "west",
        },
        6: {
          size: "1920x400",
          gravity: "center",
        },
      };

      gm()
        .out("-size", templateSettings[index].size)
        .out("-gravity", templateSettings[index].gravity)
        .out("-background", "transparent")
        .out("-fill", "white")
        .out("-kerning", "-1")
        .out(`caption:${text}`)
        .write(outputFile, (error) => {
          if (error) {
            return reject(error);
          }

          console.log(`> [video-robot] Sentence created: ${outputFile}`);
          resolve();
        });
    });
  }

  async function createYouTubeThumbnail() {
    return new Promise((resolve, reject) => {
      gm()
        .in(content.convertedImages[0])
        .write(fromRoot("./content/youtube-thumbnail.jpg"), (error) => {
          if (error) {
            return reject(error);
          }

          console.log("> [video-robot] YouTube thumbnail created");
          resolve();
        });
    });
  }

  async function createAfterEffectsScript(content) {
    await state.saveScript(content);
  }

  async function renderVideoWithAfterEffects() {
    return new Promise((resolve, reject) => {
      const systemPlatform = os.platform;

      if (systemPlatform == "darwin") {
        const aerenderFilePath =
          "/Applications/Adobe After Effects CC 2019/aerender";
      } else if (systemPlatform == "win32") {
        const aerenderFilePath =
          "%programfiles%AdobeAdobe After Effects CCArquivos de suporteaerender.exe";
      } else {
        return reject(new Error("System not Supported"));
      }

      const templateFilePath = fromRoot("./templates/1/template.aep");
      const destinationFilePath = fromRoot("./content/output.mov");

      console.log("> [video-robot] Starting After Effects");

      const aerender = spawn(aerenderFilePath, [
        "-comp",
        "main",
        "-project",
        templateFilePath,
        "-output",
        destinationFilePath,
      ]);

      aerender.stdout.on("data", (data) => {
        process.stdout.write(data);
      });

      aerender.on("close", () => {
        console.log("> [video-robot] After Effects closed");
        resolve();
      });
    });
  }
}

module.exports = robot;
