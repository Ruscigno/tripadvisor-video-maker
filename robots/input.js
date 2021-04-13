// const readline = require('readline-sync')
const state = require('./state.js')

function robot() {
  const content = {
    maximumSentences: 7
  }

  content.searchTerm = 'Clearwater Beach';
  content.listingURL = 'https://www.tripadvisor.ca/Attraction_Review-g34141-d117476-Reviews-Clearwater_Beach-Clearwater_Florida.html#REVIEWS';
  content.prefix = 'Who is';
  state.save(content);
  console.log(content);
//   function askAndReturnSearchTerm() {
//     // return readline.question('Type a Wikipedia search term: ')
//     // https://www.tripadvisor.ca/Attraction_Review-g34141-d117476-Reviews-Clearwater_Beach-Clearwater_Florida.html#REVIEWS
//     // https://www.tripadvisor.ca/Attraction_Review-g34141-d117476-Reviews-or5-Clearwater_Beach-Clearwater_Florida.html#REVIEWS
//     // https://www.tripadvisor.ca/Attraction_Review-g34141-d117476-Reviews-or10-Clearwater_Beach-Clearwater_Florida.html#REVIEWS
//     // https://www.tripadvisor.ca/Attraction_Review-g34141-d117476-Reviews-or15-Clearwater_Beach-Clearwater_Florida.html#REVIEWS
//     // https://www.tripadvisor.ca/Attraction_Review-g34141-d117476-Reviews-or20-Clearwater_Beach-Clearwater_Florida.html#REVIEWS
//     // https://www.tripadvisor.ca/Attraction_Review-g34141-d117476-Reviews-or25-Clearwater_Beach-Clearwater_Florida.html#REVIEWS
//     return 'https://www.tripadvisor.ca/Attraction_Review-g34141-d117476-Reviews-Clearwater_Beach-Clearwater_Florida.html#REVIEWS'
//   }

//   function askAndReturnPrefix() {
    // const prefixes = ['Who is', 'What is', 'The history of']
    // const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
    // const selectedPrefixText = prefixes[selectedPrefixIndex]

    // return selectedPrefixText
//   }

}

module.exports = robot
