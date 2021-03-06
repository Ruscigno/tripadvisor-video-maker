const gm = require("gm").subClass({ imageMagick: true });
const state = require("./state.js");
const spawn = require("child_process").spawn;
const path = require("path");
const rootPath = path.resolve(__dirname, "..");

const os = require('os')
const fs = require('fs')

const videoshow = require('videoshow')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path

const audio = path.join(__dirname, '../templates/1/newsroom.mp3')
const video = path.join(__dirname, '../content/output.mp4')

let ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

const fromRoot = (relPath) => path.resolve(rootPath, relPath);

async function robot() {
  console.log("> [video-robot] Starting...");
  const content = state.load();

  await convertAllImages(content);
  await createAllSentenceImages(content);
  await createYouTubeThumbnail();
  await createVideoScript(content);
  await renderVideo(content);

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

  async function createVideoScript(content) {
    await state.saveScript(content)
  }

  async function renderVideo(content) {
    let aerenderFilePath;

    const systemPlatform = os.platform
    if (systemPlatform == 'darwin'){
      aerenderFilePath = '/Applications/Adobe After Effects CC 2019/aerender'
    }else if (systemPlatform =='win32'){
      aerenderFilePath = '%programfiles%\Adobe\Adobe After Effects CC\Arquivos de suporte\aerender.exe'
    }

    try {
      if (fs.existsSync(aerenderFilePath)) {
        return await renderVideoWithAfterEffects(aerenderFilePath)
      }
    } catch(err) {
      console.error(err)
    }

    return await renderVideoWithFFmpeg(content)
  }

  async function renderVideoWithAfterEffects(aerenderFilePath) {
    return new Promise((resolve, reject) => {
      const templateFilePath = fromRoot('./templates/1/template.aep')
      const destinationFilePath = fromRoot('./content/output.mov')
    })
   }

  async function renderVideoWithFFmpeg(content) {
    return new Promise((resolve, reject) => {
      let images = []

      for (let i = 0; i < content.sentences.length; i++) {
        images.push({
          path: content.convertedImages[i],
          caption: content.sentences[i].text
        })
      }

      const videoOptions = {
        fps: 25,
        loop: 5, // seconds
        transition: true,
        transitionDuration: 1, // seconds
        videoBitrate: 1024,
        videoCodec: "libx264",
        size: "680x?",
        audioBitrate: "128k",
        audioChannels: 2,
        format: "mp4",
        pixelFormat: "yuv420p",
        useSubRipSubtitles: false, // Use ASS/SSA subtitles instead
        subtitleStyle: {
          Fontname: "Verdana",
          Fontsize: "42",
          PrimaryColour: "11861244",
          SecondaryColour: "11861244",
          TertiaryColour: "11861244",
          BackColour: "-2147483640",
          Bold: "2",
          Italic: "0",
          BorderStyle: "2",
          Outline: "2",
          Shadow: "3",
          Alignment: "1", // left, middle, right
          MarginL: "40",
          MarginR: "60",
          MarginV: "40"
        }
      }

      videoshow(images, videoOptions)
        .audio(audio)
        .save(video)
        .on("start", () => {
          console.log('> [video-robot] Starting FFmpeg')
        })
        .on("error", (err, stdout, stderr) => {
          console.error("Error:", err)
          console.error("ffmpeg stderr:", stderr)
          reject(err)
        })
        .on("end", () => {
          console.log('> [video-robot] FFmpeg closed')
          resolve()
        })
    })
  }
}

module.exports = robot;
