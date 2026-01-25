const ParserStrategy = require('./parser');

class MSWordParser extends ParserStrategy {
  parse(file) {
    // Implement MS Word parsing logic here
    return `Parsing MS Word file: ${file.name}`;
  }
}

module.exports = MSWordParser;