// pages/ncov/ncov.js

const Virus = require('../../models/VirusModel').getInstance();
const QQMapWX = require('../../utils/qqmap-wx-jssdk.min.js');
const wxMap = new QQMapWX({
  key: 'GUZBZ-YRK6P-CHZDS-V5MYN-JJX7J-47FLD'
})

var MapContext;

Page({
  /**
   * 页面的初始数据
   */

  data: {
    content: "",
    placeholder: "搜索地点、小区、街道等",
    city: "",
    keyword: "",
    address: "获取位置信息失败",
    areaStatus: false,
    levels: [0, 1, 2],
    areaList: [],
    caseList: [],
    currentParentIndex: -1,
    currentChildIndex: -1,
    currentGrandSonIndex: -1,
    locationPermission: false,
    markers: [],
    latitude: "39.90374",
    longitude: "116.397827",
    mapStatus: false,
    scale: 12
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getCityData();
    this.getUserLocationInfo();
  },



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    MapContext = wx.createMapContext("map")
  },

  /**
   * 获取城市选择列表
   */
  getCityData() {
    Virus.getAreaList(({
      areaList,
      content,
      placeholder
    }) => {
      this.setData({
        areaList: areaList,
        content: content,
        placeholder: placeholder
      })
    })
  },

  // 选择城市
  chooseCity(event) {
    let {
      index,
      level
    } = event.currentTarget.dataset
    let {
      currentParentIndex,
      currentChildIndex,
      currentGrandSonIndex
    } = this.data
    if (level == 0 && currentParentIndex != index) {
      currentParentIndex = index
      currentChildIndex = -1
      currentGrandSonIndex = -1
    } else if (level == 1 && currentChildIndex != index) {
      currentChildIndex = index
      currentGrandSonIndex = -1
    } else {
      currentGrandSonIndex = index
    }
    this.setData({
      currentParentIndex: currentParentIndex,
      currentChildIndex: currentChildIndex,
      currentGrandSonIndex: currentGrandSonIndex
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {},

  getUserLocationInfo() {
    let that = this
    wx.promisify('getSetting')().then((setRes) => {
      if (setRes.authSetting['scope.userLocation'] === false) {
        that.setData({
          locationPermission: false
        })
      } else {
        that.setData({
          locationPermission: true
        })
        wx.getLocation({
          type: "wgs84",
          success(res) {
            const latitude = res.latitude;
            const longitude = res.longitude;
            that.setCasesAndCitys(latitude, longitude)
          },
          fail(e) {
            console.log("e", e);
          }
        });
      }
    })
  },

  // 获取案例 - 以及设置城市标题
  setCasesAndCitys(latitude, longitude) {
    let that = this
    wxMap.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: function (analyRes) {
        const {
          province,
          city,
          district
        } = analyRes.result.address_component
        // 经纬度反解析城市
        Virus.getLocationCase(city, latitude, longitude, (cases) => {
          that.setData({
            latitude: latitude,
            longitude: longitude,
            city: city,
            address: [province, city, district].join(''),
            caseList: cases
          }, () => {
            that.setMapMarkers()
          })
        })
      }
    })
  },

  // 地图屏幕回到原处
  moveToLocation() {
    let that = this
    MapContext.moveToLocation({
      success() {
        that.getUserLocationInfo()
      }
    })
  },

  toggleArea(event) {
    let {
      show
    } = event.currentTarget.dataset
    this.setData({
      areaStatus: Boolean(parseInt(show))
    })
  },


  // 切换地图模式
  toggleMap() {
    this.setData({
      mapStatus: !this.data.mapStatus
    })
  },


  /**
   * 确认选择城市操作Action
   */
  sureArea() {
    let {
      currentParentIndex,
      currentChildIndex,
      currentGrandSonIndex,
      areaList
    } = this.data
    // 城市查询
    let provinceID = 0,
      cityID = 0,
      districtID = 0
    let address = ''
    if (currentParentIndex > -1 && currentChildIndex > -1) {
      provinceID = areaList[currentParentIndex].areaID
      cityID = areaList[currentParentIndex].children[currentChildIndex].areaID
      address = areaList[currentParentIndex].name + areaList[currentParentIndex].children[currentChildIndex].name
      if (currentGrandSonIndex > -1) {
        districtID = areaList[currentParentIndex].children[currentChildIndex].children[currentGrandSonIndex].areaID
        address += areaList[currentParentIndex].children[currentChildIndex].children[currentGrandSonIndex].name
      }
      // 注解，箭头函数中的this指的是外部的this
      Virus.searchCityInfo(provinceID, cityID, districtID, (cases) => {
        this.setData({
          address: address,
          caseList: cases,
          areaStatus: false
        })
      })
    } else {
      wx.showToast({
        title: '请选择城市',
        icon: 'none',
      })
    }
  },
  // 遮罩层禁用滑动
  catchtouchmove() {
    return false
  },

  // 搜索文字输入
  onChange(e) {
    this.setData({
      keyword: e.detail
    });
  },

  // 搜索小区
  onSearch() {
    let keyword = this.data.keyword
    Virus.searchCommunity(keyword, (cases) => {
      this.setData({
        address: `搜索“${keyword}”结果`,
        caseList: cases
      })
    })
  },

  // 设置回调 -- 定位权限
  openSetting(event) {
    if (event.detail.authSetting['scope.userLocation'] === true) {
      this.getUserLocationInfo()
    } else {
      wx.showToast({
        title: '授权失败',
        icon: 'none'
      })
    }
  },

  regionChange(event) {
    let that = this
    let {
      type,
      causedBy
    } = event
    if (type === 'end' && ['scale', 'drag'].indexOf(causedBy) > -1) {
      MapContext.getCenterLocation({
        success({
          latitude,
          longitude
        }) {
          that.setCasesAndCitys(latitude, longitude)
        }
      })
    }
  },

  getLocation(e) {
    var that = this
    wx.chooseLocation({
      success: function ({
        latitude,
        longitude
      }) {
        that.setCasesAndCitys(latitude, longitude)
      }
    })
  },

  setMapMarkers() {
    let caseList = this.data.caseList
    let markers = []
    // set markers
    for (let i = 0; i < caseList.length; i++) {
      markers.push({
        latitude: caseList[i].lat,
        longitude: caseList[i].lng,
        iconPath: "/images/virus.png",
        width: 25,
        height: 26,
        callout: {
          fontSize: '24rpx',
          color: '#ffffff',
          padding: '4rpx',
          content: caseList[i].show_address,
          bgColor: '#ff0026',
          display: 'ALWAYS',
          textAlign: 'center'
        }
      })
    }
    this.setData({
      markers
    })
  }
});