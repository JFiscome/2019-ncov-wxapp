const BaseModel = require('./BaseModel');
class VirusModel extends BaseModel {
    constructor() {
        super();
    }

    getAreaList(callback) {
        this.http({
            url: 'virus/area'
        }, true).then(callback)
    }

    getLocationCase(city, lat, lng, callback) {
        this.http({
            url: `virus/location?city=${city}&lat=${lat}&lng=${lng}`
        }, true).then(callback)
    }

    searchCityInfo(provinceID, cityID, districtID, callback) {
        this.http({
            url: `virus/cityCase?provinceID=${provinceID}&cityID=${cityID}&districtID=${districtID}`
        }, true).then(callback)
    }

    searchCommunity(keyword, callback) {
        this.http({
            url: `virus/community?keyword=${keyword}`
        }, true).then(callback)
    }
}

module.exports = VirusModel;