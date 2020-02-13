const config = require("../config");
const md5 = require("./md5");

const getHttpSalt = timestamp => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const string = [year, month, day, config.http_salt, timestamp].join("-");
  const salt = md5(string);
  return salt;
};

const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return (
    [year, month, day].map(formatNumber).join("/") +
    " " +
    [hour, minute, second].map(formatNumber).join(":")
  );
};

const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : "0" + n;
};

// 计算倒计时
const countDownTimestamp = timestamp => {
  let stopDate = new Date(timestamp);
  let nowDate = +new Date();
  let s = 0;
  let m = 0;
  let h = 0;
  let day = 0;
  let year = 0;
  let month = 0;
  let day1 = 0;
  if (nowDate < timestamp) {
    let dTime = timestamp - nowDate;
    s = dTime / 1000;
    m = s / 60;
    h = m / 60;
    day = h / 24;
    if (parseInt(day) !== 0) {
      year = stopDate.getFullYear();
      month = stopDate.getMonth() + 1;
      day1 = stopDate.getDate();
    }
  }
  return {
    year: year,
    month: month,
    day: day1,
    h: parseInt(h % 24),
    m: parseInt(m % 60),
    s: parseInt(s % 60)
  };
};

const fillWithZero = (num, length = 2) => {
  num = String(num);
  let fillLength = length - num.length;
  let fill = "";
  for (let i = 0; i < fillLength; i++) {
    fill += "0";
  }
  num = String(num).length < length ? fill + num : num;
  return num;
};

function getTimeDistance(str) {
  //2014-10-29 18:00:00
  /*var ymd = str.split(" ")[0];
  var ymd_arr = ymd.split("-");
  var hms = str.split(" ")[1];
  var hms_arr = hms.split(":");
*/
  // var date1 = new Date(ymd_arr[0], ymd_arr[1] - 1, ymd_arr[2], hms_arr[0], hms_arr[1], hms_arr[2]);
  var date1 = new Date(str);
  var date2 = new Date(); //结束时间
  // //console.log(date1.getTime()+"------"+date2)
  var date3 = date2.getTime() - date1.getTime(); //时间差的毫秒数
  //计算出相差天数
  var days = Math.floor(date3 / (24 * 3600 * 1000));

  //计算出小时数

  var leave1 = date3 % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
  var hours = Math.abs(Math.floor(leave1 / (3600 * 1000)));
  //计算相差分钟数
  var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
  var minutes = Math.floor(leave2 / (60 * 1000));
  //计算相差秒数
  var leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
  var seconds = Math.round(leave3 / 1000);
  //alert(" 相差 "+days+"天 "+hours+"小时 "+minutes+" 分钟"+seconds+" 秒");

  if (days > 0) {
    if (days / 365 >= 1) {
      return Math.floor(days / 365) + "年前";
    } else {
      return days + "天前";
    }
  } else {
    if (hours > 0) {
      return hours + "小时前";
    } else {
      if (minutes <= 3) {
        return "刚刚";
      } else {
        return minutes + "分钟前";
      }
    }
  }

  return "刚刚";
}

function trimStr(str) {
  var s = str.replace(/(^\s*)|(\s*$)/g, "");
  return s;
}

function getCityFromLocation(gps, cb) {
  wx.request({
    url:
      "https://api.map.baidu.com/geocoder/v2/?coordtype=gcj02ll&location=" +
      gps +
      "&output=json&pois=1&ak=PCgWIW1cx4YkYcY7UIYyufosUkVCf9k4",
    method: "GET",
    success: function(res) {
      if (cb) cb(res.data.result);
    }
  });
}

function getLocationFromCity(city, cb) {
  wx.request({
    url:
      "https://api.map.baidu.com/geocoder/v2/?address=" +
      city +
      "&output=json&ret_coordtype=GCJ02&ak=PCgWIW1cx4YkYcY7UIYyufosUkVCf9k4",
    method: "GET",
    success: function(res) {
      if (cb) cb(res.data.result);
    }
  });
}

function getCityByLatLng(lat, lng, callback) {
  let newInfo = qqMapToBMap(lat, lng);
  console.log("this is newInfo", newInfo);
  wx.request({
    url: `http://api.map.baidu.com/geocoder?location=${newInfo.lat},${newInfo.lng}&output=json&ak=PCgWIW1cx4YkYcY7UIYyufosUkVCf9k4`,
    success(res) {
      callback(res.data.result);
    }
  });
}

function getCityFromStr(str) {
  var shiIndex = str.indexOf("市");
  var city = str;
  //console.log(city);
  if (shiIndex >= 0) {
    city = city.substr(0, shiIndex);
    //console.log(city);
    var provinceIndex = city.indexOf("省");
    if (provinceIndex >= 0) {
      city = city.substr(provinceIndex + 1, city.length);
      //console.log(city);
    } else if (city.indexOf("自治区") >= 0) {
      city = city.substr(city.indexOf("自治区") + 3, city.length);
      //console.log(city);
    }
  } else {
    city = city.substr(0, str.indexOf("特别行政区"));
    //console.log(city);
  }

  return city;
}
/**
 * 坐标转换，百度地图坐标转换成腾讯地图坐标
 * lng 腾讯经度（pointy）
 * lat 腾讯纬度（pointx）
 * 经度>纬度
 */
function bMapToQQMap(lat, lng) {
  if (lng == null || lng == "" || lat == null || lat == "") return { lat, lng };

  var x_pi = 3.14159265358979324;
  var x = parseFloat(lng) - 0.0065;
  var y = parseFloat(lat) - 0.006;
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
  var lng = (z * Math.cos(theta)).toFixed(7);
  var lat = (z * Math.sin(theta)).toFixed(7);

  return { lat, lng };
}

/**
 * 坐标转换，腾讯地图转换成百度地图坐标
 * lng 腾讯经度（pointy）
 * lat 腾讯纬度（pointx）
 * 经度>纬度
 */

function qqMapToBMap(lat, lng) {
  if (lng == null || lng == "" || lat == null || lat == "") return { lat, lng };

  var x_pi = 3.14159265358979324;
  var x = parseFloat(lng);
  var y = parseFloat(lat);
  var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);
  var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);
  var lng = (z * Math.cos(theta) + 0.0065).toFixed(5);
  var lat = (z * Math.sin(theta) + 0.006).toFixed(5);
  return { lat, lng };
}

module.exports = {
  formatTime,
  getHttpSalt,
  countDownTimestamp,
  getTimeDistance,
  trimStr,
  getCityFromLocation,
  getLocationFromCity,
  getCityFromStr,
  getCityByLatLng
};
