const { http } = require('../utils/http')
class BaseModel {
  constructor() {
    this.http = http
  }

  static getInstance() {
    return new this();
  }
}

module.exports = BaseModel