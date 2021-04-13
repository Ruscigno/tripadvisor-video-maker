const imageDownloader = require("image-downloader");
const google = require("googleapis").google;
const customSearch = google.customsearch("v1");
const state = require("./state.js");
const cheerio = require("cheerio");

const googleSearchCredentials = require("../credentials/google-search.json");

async function robot() {
  console.log("> [image-robot] Starting...");
  const content = state.load();

  await fetchImagesOfAllSentences(content);
  await downloadAllImages(content);

  state.save(content);

  async function fetchImagesOfAllSentences(content) {
    content.images = [];
    const $ = cheerio.load(content.html);
    let pos = 0;
    $("meta[property='og:image']").each(function (i, e) {
      let meta = $(this)[0].attribs.content;
      if (meta.length <= 33) {
        return;
      }
      const imageURL =
        "https://media-cdn.tripadvisor.com/media/photo-m/1280/" +
        meta.substring(48);
      content.images[pos] = imageURL;
      pos++;
    });
  }

  async function downloadAllImages(content) {
    content.downloadedImages = [];
    content.sentenceImages = [];
    content.imagesFileNames = [];

    for (let i = 0; i < content.images.length; i++) {
      const imageUrl = content.images[i];
      try {
        if (content.downloadedImages.includes(imageUrl)) {
          throw new Error("Image already downloaded");
        }

        let fileExt = imageUrl.split(".").pop();
        let fileName = `./content/${i}-original.${fileExt}`;
        let sentenceImage = `./content/${i}-sentence.${fileExt}`;
        await downloadAndSave(imageUrl, fileName);
        content.sentenceImages.push(sentenceImage); 
        content.downloadedImages.push(fileName);
        console.log(
          `> [image-robot] [${i}] Image successfully downloaded: ${imageUrl}`
        );
      } catch (error) {
        console.log(
            `> [image-robot] [${i}] Error (${imageUrl}): ${error}`
        );
      }
    }
  }

  async function downloadAndSave(url, fileName) {
    return imageDownloader.image({
      url: url,
      dest: fileName,
    });
  }
}

module.exports = robot;
