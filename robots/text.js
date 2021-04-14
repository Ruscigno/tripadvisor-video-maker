const algorithmia = require("algorithmia");
const algorithmiaApiKey = require("../credentials/algorithmia.json").apiKey;
const sentenceBoundaryDetection = require("sbd");
const rp = require("request-promise");
const cheerio = require("cheerio");

const watsonApiKey = require("../credentials/watson-nlu.json").apikey;
const NaturalLanguageUnderstandingV1 = require("watson-developer-cloud/natural-language-understanding/v1.js");

const nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watsonApiKey,
  version: "2018-04-05",
  url: "https://gateway.watsonplatform.net/natural-language-understanding/api/",
});

const state = require("./state.js");

async function robot() {
  console.log("> [text-robot] Starting...");
  const content = state.load();

  await fetchContentFromTripAdvisor(content);
  sanitizeContent(content);
  breakContentIntoSentences(content);
  limitMaximumSentences(content);
//   await fetchKeywordsOfAllSentences(content);

  state.save(content);

  async function fetchContentFromTripAdvisor(content) {
    content.reviews = [];
    const indexOfFirst = content.listingURL.indexOf("-Reviews-");
    const urls = [];
    urls[0] = content.listingURL;
    // urls[1] = content.listingURL.substr(0, indexOfFirst) + "-Reviews-or5-" + content.listingURL.substr(indexOfFirst + 9, indexOfFirst);
    // urls[2] = content.listingURL.substr(0, indexOfFirst) + "-Reviews-or10-" + content.listingURL.substr(indexOfFirst + 9, indexOfFirst);
    // urls[3] = content.listingURL.substr(0, indexOfFirst) + "-Reviews-or15-" + content.listingURL.substr(indexOfFirst + 9, indexOfFirst);
    // urls[4] = content.listingURL.substr(0, indexOfFirst) + "-Reviews-or20-" + content.listingURL.substr(indexOfFirst + 9, indexOfFirst);
    let pos = 0;
    for (let i = 0; i < urls.length; i++) {
      await rp(urls[i])
        .then(function (html) {
          if (i == 0) {
            content.html = html;
          }
          const $ = cheerio.load(html);
          $("q > span").each(function (i, e) {
            let body = $(this).text();
            if (body.length <= 3) {
              return;
            }
            if (body.substring(0, 1) === body.substring(0, 1).toLowerCase()) {
              content.reviews[pos - 1] = content.reviews[pos - 1] + " " + body;
              return;
            }
            content.reviews[pos] = body;
            pos++;
          });
        })
        .catch(function (err) {
          console.log(err);
          return;
        });
    }
  }

  function sanitizeContent(content) {
    // const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(review);
    // const withoutDatesInParentheses = removeDatesInParentheses(
    //   withoutBlankLinesAndMarkdown
    // );
    // content.sanitizedReviews = withoutDatesInParentheses;
    // function removeBlankLinesAndMarkdown(text) {
    //   const allLines = text.split("\n");
    //   const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
    //     if (line.trim().length === 0 || line.trim().startsWith("=")) {
    //       return false;
    //     }
    //     return true;
    //   });
    //   return withoutBlankLinesAndMarkdown.join(" ");
    // }
  }

  function removeDatesInParentheses(text) {
    return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, "").replace(/  /g, " ");
  }

  function breakContentIntoSentences(content) {
    content.sentences = [];
    let reviews = [];
    content.reviews.forEach((review) => {
      reviews = reviews.concat(sentenceBoundaryDetection.sentences(review));
    });

    reviews.forEach((review) => {
      content.sentences.push({
        text: review,
        keywords: [],
        images: [],
      });
    });
  }

  function limitMaximumSentences(content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences);
  }

  async function fetchKeywordsOfAllSentences(content) {
    console.log("> [text-robot] Starting to fetch keywords from Watson");

    for (const sentence of content.sentences) {
      console.log(`> [text-robot] Sentence: "${sentence.text}"`);

      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text);

      console.log(`> [text-robot] Keywords: ${sentence.keywords.join(", ")}\n`);
    }
  }

  async function fetchWatsonAndReturnKeywords(sentence) {
    return new Promise((resolve, reject) => {
      nlu.analyze(
        {
          text: sentence,
          features: {
            keywords: {},
          },
        },
        (error, response) => {
          if (error) {
            reject(error);
            return;
          }

          const keywords = response.keywords.map((keyword) => {
            return keyword.text;
          });

          resolve(keywords);
        }
      );
    });
  }
}

module.exports = robot;
