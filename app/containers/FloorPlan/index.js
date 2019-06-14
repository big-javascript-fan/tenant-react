import React from 'react';
import moment from 'moment';
import config from 'config';
import TimePicker from 'antd/lib/time-picker';
import DatePicker from 'antd/lib/date-picker';
import Alert from 'antd/lib/alert';
import Spin from 'antd/lib/spin';
import 'antd/dist/antd.css';
import { Map } from 'immutable';
import { Dropdown, MenuItem, Modal } from 'react-bootstrap';
import Slider from "react-slick";
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import uuidv1 from 'uuid';
import { fabric } from 'fabric';
import some from 'lodash/some';
import orderBy from 'lodash/orderBy';
import filter from 'lodash/filter';

export default class FloorPlan extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: '1',
      today: null,
      startDate: null,
      endDate: null,
      chosenDate: [],
      chosenDay: null,
      chosenMonth: null,
      chosenYear: null,
      dates: [],
      dayNames: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      showModal: false,
      showEditModal: false,
      chosenRecurringPattern: 'One Time',
      chosenLevel: 'All Levels',
      chosenDaysInWeek: [],
      chosenDaysInMonth: [],
      fullChosenDate: null,
      startTime: moment().format('HH:mm'),
      duration: moment('00:00', 'HH:mm').format('HH:mm'),
      fromDay: moment().format('YYYY-MM-DD'),
      toDay: moment().format('YYYY-MM-DD'),
      Purpose: '',
      selectedLevel: {},
      selectedZone: {},
      selectedCompany: {},
      currentLevel_Name: '',
      currentZonesList: [],
      currentRequest: {},
      levelZonesList: {},
      companiesList: [],
      companyUserList: [],
      levelsList: [],
      selectedZone_request: {},
      oneTimeRequest: [],
      recurringRequest: [],
      allOneTimeRequests: [],
      allRecurringRequests: [],
      days: {
        '0': 'sunday',
        '1': 'monday',
        '2': 'tuesday',
        '3': 'wednesday',
        '4': 'thursday',
        '5': 'friday',
        '6': 'saturday'
      },
      permissionsList: [],
      selectedUser: {},
      allFloorUsers: [],
      permissionZones: [],
      canvas: null,
      environment: false,
      showAlert: false,
      alertMessage: null,
      loadingOneTime: true,
      loadingRecurring: true,
      loading: true
    }
  };

  componentDidMount() {
    if (typeof this.props.location.state != 'undefined') {
      if (sessionStorage.getItem('role') != 'ROLE_ADMIN') {
        if (sessionStorage.getItem('role') == 'ROLE_CLIENT') {
          this.setState({ permissionsList: this.props.location.state.companies[0].permissions.levels })
        }
        else {
          this.getUserPermission();
        }
        let list = this.props.location.state.floor.zones;
        this.setState({ currentZonesList: list });
      }

      let today = moment();
      let num = Number(today.format('d'));
      let startDate = num !== 0 && num > 0 ? moment().add(-num, 'd') : moment();
      let endDate = startDate.clone().add(13, 'd');
      this.enumerateDaysBetweenDates(startDate.clone(), endDate.clone(), false);
      this.setState({
        chosenDate: [{
          day: today.format('D'),
          month: today.format('MMMM'),
          year: today.format('YYYY')
        }],
        chosenDay: today.format('D'),
        chosenMonth: today.format('MMMM'),
        chosenYear: today.format('YYYY'),
        startDate: startDate.format('D/MMM/YYYY'),
        endDate: endDate.format('D/MMM/YYYY'),
        fullChosenDate: today.format('D') + ' ' + today.format('MMM') + ' ' + today.format('YYYY'),
      }, () => {
        this.getData();
        if (sessionStorage.getItem('role') == 'ROLE_USER') {
          this.getRequest();
        }
      });

    }
    else {
      this.props.history.push({ pathname: '/navigation' });
    }
    let canvas = new fabric.Canvas('canvas');
    fabric.Object.prototype.transparentCorners = false;
    this.setState({ canvas: canvas });

  }

  selectZone = (zone) => {
    this.setState({ selectedZone: zone });
  }

  drawFloorPlan = (zonesList) => {
    let level = this.state.selectedLevel;
    let canvas = this.state.canvas;
    if (level.outline != null) {
      let temp = JSON.stringify(level.outline);
      canvas.loadFromDatalessJSON(temp, () => {
        let obj = canvas.getObjects();
        let zone_id = this.state.selectedZone.id;
        for (let i in obj) {
          let id = obj[i].zone_id;
          if (id == zone_id) {
            obj[i].item(0).set({
              stroke: 'rgba(222,78,42,1)',
              strokeWidth: 1,
              fill: 'rgba(222,78,42,0.5)',
            });
            obj[i].item(1).set({
              stroke: 'rgba(0,0,0,0)',
              fill: 'rgba(222,78,42)',
            });
            canvas.renderAll();
          }
          obj[i].lockMovementX = true;
          obj[i].lockMovementY = true;
          obj[i].lockScalingX = true;
          obj[i].lockScalingY = true;
          obj[i].lockRotation = true;
          obj[i].hasBorders = false;
          obj[i].hasControls = false;
          obj[i].on('mousedown', (e) => {
            let selected = zonesList.filter((zone, index) => zone.id === obj[i].zone_id);
            this.selectZone(selected[0]);

            canvas.getObjects().forEach((obj) => {
              obj.item(0).set({
                strokeWidth: 1,
                stroke: 'rgba(49,55,58,1)',
                fill: 'rgba(49,55,58,0.5)',
              });
              obj.item(1).set({
                stroke: 'rgba(0,0,0,0)',
                fill: 'rgba(49,55,58)',
              });
            });
            obj[i].item(0).set({
              stroke: 'rgba(222,78,42,1)',
              strokeWidth: 1,
              fill: 'rgba(222,78,42,0.5)',
            });
            obj[i].item(1).set({
              stroke: 'rgba(0,0,0,0)',
              fill: 'rgba(222,78,42)',
            });
          });
        }
      });
    }
    else {
      canvas.setBackgroundImage('./floor_plan.png', canvas.renderAll.bind(canvas), {});
    }
  }

  clearFloorPlan = (zonesList) => {
    let canvas = this.state.canvas;
    canvas.clear();
    this.drawFloorPlan(zonesList);
  }

  getEditDuration = () => {
    let edit_dur;
    if (this.state.currentRequest != {}) {
      let temp = this.state.currentRequest.duration
      if (temp >= 60) {
        let h = temp / 60 | 0;
        let m = temp % 60 | 0;
        edit_dur = h + ':' + m;
      }
      else {
        edit_dur = '00:' + temp;
      }
    }
    this.setState({ edit_Duration: edit_dur }, () => {
      this.getEditEnd();
    });
  }

  getEditEnd = () => {
    let start = moment(this.state.edit_StartTime, 'HH:mm');
    let duration = moment(this.state.edit_Duration, 'HH:mm');
    let start_hour = start.get('hour');
    let start_minute = start.get('minute');
    let dur_hour = duration.get('hour');
    let dur_minute = duration.get('minute');
    let totals = (start_hour * 60) + start_minute + (dur_hour * 60) + dur_minute;
    let endTime;
    if (totals >= 1440) {
      endTime = moment(0, 'HH:mm').format('HH:mm');
    }
    else {
      let temp = (dur_hour * 60) + dur_minute;
      endTime = start.add(temp, 'm').format('HH:mm');
    }
    this.setState({ edit_End: endTime })
  }

  getData = () => {
    let zone = {};
    if (this.props.location.state.floor.zones.length > 0) {
      zone = {
        id: this.props.location.state.floor.zones[0].id,
        name: this.props.location.state.floor.zones[0].name
      };
    }

    this.setState({
      selectedLevel: this.props.location.state.floor,
      currentLevel_Name: this.props.location.state.floor.name,
      selectedZone: zone,
    }, () => {
      if (sessionStorage.getItem('role') === 'ROLE_ADMIN') {
        this.drawFloorPlan(this.props.location.state.floor.zones);
      }
      else {
        this.getLevelById(this.props.location.state.floor.id);
      }
      this.checkMapping(zone.id);
    });

    if (sessionStorage.getItem('role') != 'ROLE_USER') {
      this.setState({
        companiesList: this.props.location.state.companies,
        selectedCompany: this.props.location.state.companies[0],
      }, () => {
        this.getLevelCompanies();
        this.getLevelList();
      });
    }
  }

  getLevelById = (id) => {
    const requestUrl = config.serverUrl + config.api.zonemapping_levels + '/' + id;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        if (Object.keys(res)) {
          this.setState({ selectedLevel: res }, () => {
            this.drawFloorPlan(res.zones);
          })
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  enumerateDaysBetweenDates = (startDate, endDate, isUpdated = true) => {
    let now = startDate;
    let dates = [];
    let month = null;
    let year = null;
    let haveContainChosenDay = false;

    let tmp = () => {
      if (now.isSameOrBefore(endDate)) {
        let data = {
          day: now.format('D'),
          month: now.format('MMMM'),
          year: now.format('YYYY')
        }
        dates.push(data);

        // update month && year
        if (['1', '8', '15', '22', '29'].indexOf(now.format('D')) > -1) {
          month = now.format('MMMM');
          year = now.format('YYYY');
        }

        if (now.format('D') == this.state.chosenDay && now.format('MMMM') == this.state.chosenMonth && now.format('YYYY') == this.state.chosenYear) {
          haveContainChosenDay = true;
        }

        now.add(1, 'd');
        tmp();
      } else {
        let chosenDate = this.state.chosenDate;

        if (month && year && chosenDate.length > 0 && isUpdated) {
          chosenDate[0]['month'] = haveContainChosenDay ? this.state.chosenMonth : month;
          chosenDate[0]['year'] = haveContainChosenDay ? this.state.chosenYear : year;
          this.setState({ dates, chosenDate });
        } else {
          this.setState({ dates });
        }
        this.getAllOneTimeRequestsForDates(dates);
        this.getAllRecurringRequestsForDates(dates);
      }
    }

    tmp();
  };

  changeDate = (date) => {
    if (date != null) {
      let t = moment(date.day + '/' + date.month + '/' + date.year, 'D/MMMM/YYYY');
      this.setState({
        chosenDate: [{
          day: date.day,
          month: date.month,
          year: date.year
        }],
        chosenDay: date.day,
        chosenMonth: date.month,
        chosenYear: date.year,
        fullChosenDate: t.format('D') + ' ' + t.format('MMM') + ' ' + t.format('YYYY'),
        oneTimeRequest: [],
        recurringRequest: [],
      }, () => {
        if (sessionStorage.getItem('role') != 'ROLE_USER') {
          this.getRequest_2();
        }
        else {
          this.getRequest();
        }
      });
    }
  };

  pickDate = (time) => {
    if (time) {
      let date = time;
      let num = Number(date.format('d'));
      let startDate = num !== 0 && num > 0 ? date.clone().add(-num, 'd') : date.clone();
      let endDate = startDate.clone().add(13, 'd');
      this.enumerateDaysBetweenDates(startDate.clone(), endDate.clone(), false);
      this.setState({
        chosenDate: [{
          day: date.format('D'),
          month: date.format('MMMM'),
          year: date.format('YYYY')
        }],
        chosenDay: date.format('D'),
        chosenMonth: date.format('MMMM'),
        chosenYear: date.format('YYYY'),
        startDate: startDate.format('D/MMM/YYYY'),
        endDate: endDate.format('D/MMM/YYYY'),
        fullChosenDate: date.format('D') + ' ' + date.format('MMM') + ', ' + date.format('YYYY')
      }, () => {
        if (sessionStorage.getItem('role') != 'ROLE_USER') {
          this.getRequest_2();
        }
        else {
          this.getRequest();
        }
      });
    }
  }

  pickFromDay = (time) => {
    if (time) {
      this.setState({ fromDay: time.format('YYYY-MM-DD') });
    }
  }

  pickToDay = (time) => {
    if (time) {
      this.setState({ toDay: time.format('YYYY-MM-DD') });
    }
  }

  switchTab = (e) => {
    let target = e.target;
    let num = target.getAttribute('data-tab-number');
    this.setState({ activeTab: num });
  };

  goBack = () => {
    this.props.history.goBack();
  };

  handleClose = () => {
    this.setState({
      showModal: false,
      chosenDaysInWeek: [],
      chosenDaysInMonth: [],
      permissionZones: [],
    });
  };

  handleShow = (type) => {
    let zone_request = {
      id: -1,
      name: 'All Zones'
    };
    let chosenRecurringPattern = this.state.activeTab == '1' ? 'One Time' : 'Weekly';
    if (type != null) {
      chosenRecurringPattern = type;
    }
    if (sessionStorage.getItem('role') != 'ROLE_USER') {
      let companies = this.state.companiesList;
      if (companies.length == 0) {
        this.setState({
          selectedCompany: [],
          currentZonesList: []
        });
      }
      else {
        this.setState({
          selectedCompany: companies[0]
        });
        this.getUserList(companies[0].id);
      }
    }
    else {
      this.setState({
        permissionZones: orderBy(this.state.selectedLevel.zones, [item => item.name.toLowerCase()], ['asc']),
        // permissionZones: this.state.selectedLevel.zones
      });
    }
    this.setState({
      showModal: true,
      chosenRecurringPattern,
      selectedZone_request: zone_request,
      startTime: moment().format('HH:mm'),
      duration: moment('00:00', 'HH:mm').format('HH:mm'),
      fromDay: moment().format('YYYY-MM-DD'),
      toDay: moment().format('YYYY-MM-DD'),
      //toDay: null,
      Purpose: '',
    });
  };

  handleShowA = (type, request) => {
    const zone_request = {
      id: request.zone_id,
      name: request.zone_name
    };
    this.setState({
      showEditModal: true,
      currentRequest: request,
      selectedZone_request: zone_request,
      chosenRecurringPattern: type,
      Purpose: request.purpose,
    }, () => {
      this.getEditDuration();
      this.getPermission();
    });
    if (type != 'One Time') {
      if (type == 'weekly') {
        let daysList = new Array();
        let i = 0;
        request.recurring_every.forEach((day, index) => {
          let j = 0;
          for (let key in this.state.days) {
            if (this.state.days[key] == day) {
              let num = parseInt(key);
              daysList.push(num);
            }
            j++;
            if (i == request.recurring_every.length - 1 && j == Object.keys(this.state.days).length - 1) {
              this.setState({ chosenDaysInWeek: daysList });
            }
          }
          if (i < request.recurring_every.length - 1) {
            i++;
          }
        });
      }
      else {
        let daysList = new Array();
        let i = 0;
        request.recurring_every.forEach((day, index) => {
          daysList.push(parseInt(day));
          if (i == request.recurring_every.length - 1) {
            this.setState({ chosenDaysInMonth: daysList });
          }
          if (i < request.recurring_every.length - 1) {
            i++;
          }
        });
      }
      this.setState({
        fromDay: request.date_from,
        toDay: request.date_to,
        edit_StartTime: request.start,
      });
    }
    else {
      this.setState({
        edit_StartTime: request.start_time,
      });
    }
  }

  handleCloseA = () => {
    this.setState({
      showEditModal: false,
      chosenDaysInWeek: [],
      chosenDaysInMonth: [],
      currentRequest: {},
      permissionZones: [],
    });
  }

  select = (e) => {
    if (e.parent == 'zone') {
      let zone = {
        id: e.id,
        name: e.name
      };
      this.setState({ selectedZone: zone }, () => {
        this.checkMapping(zone.id);
        let canvas = this.state.canvas;
        canvas.getObjects().forEach((obj) => {
          if (obj.zone_id == e.id) {
            obj.item(0).set({
              stroke: 'rgba(222,78,42,1)',
              strokeWidth: 1,
              fill: 'rgba(222,78,42,0.5)',
            });
            obj.item(1).set({
              stroke: 'rgba(0,0,0,0)',
              fill: 'rgba(222,78,42)',
            });
          }
          else {
            obj.item(0).set({
              strokeWidth: 1,
              stroke: 'rgba(49,55,58,1)',
              fill: 'rgba(49,55,58,0.5)',
            });
            obj.item(1).set({
              stroke: 'rgba(0,0,0,0)',
              fill: 'rgba(49,55,58)',
            });
          }
        });
        canvas.renderAll();
      });
    }
    else if (e.parent == 'level') {
      let zone = {};
      if (e.level_info.zones.length > 0) {
        zone = e.level_info.zones[0];
      }
      this.setState({
        selectedLevel: e.level_info,
        selectedZone: zone,
        currentZonesList: e.level_info.zones,
        selectedUser: {},
        companyUserList: [],
      }, () => {
        if (sessionStorage.getItem('role') === 'ROLE_ADMIN') {
          this.getLevelCompanies();
        }
        else {
          this.getLevelById(e.level_info.id);
        }
        this.clearFloorPlan(e.level_info.zones);
      });
    }
    else if (e.parent == 'company') {
      this.setState({
        selectedCompany: e.company,
        selectedZone_request: {
          id: -1,
          name: 'All Zones',
        },
      }, () => this.getUserList(e.company.id));
    }
    else if (e.parent == 'zone_request') {
      let zone = {
        id: e.id,
        name: e.name
      };
      this.setState({
        selectedZone_request: zone
      });
    }
    else if (e.parent == 'user') {
      this.setState({
        selectedUser: e.user
      }, () => {
        this.getPermission_2();
      });
    }
  }

  selectRecurringPattern = (e) => {
    this.setState({ chosenRecurringPattern: e.name });
  }

  toggleDayInWeek = (num, status) => {
    let chosenDaysInWeek = this.state.chosenDaysInWeek;
    if (status) {
      chosenDaysInWeek = chosenDaysInWeek.filter((item) => {
        return item != num;
      });
      this.setState({ chosenDaysInWeek });
    } else {
      chosenDaysInWeek.push(num);
      this.setState({ chosenDaysInWeek });
    }
  }

  toggleDayInMonth = (num, status) => {
    let chosenDaysInMonth = this.state.chosenDaysInMonth;
    if (status) {
      chosenDaysInMonth = chosenDaysInMonth.filter((item) => {
        return item != num;
      });
      this.setState({ chosenDaysInMonth });
    } else {
      chosenDaysInMonth.push(num);
      this.setState({ chosenDaysInMonth });
    }
  }

  changeStartTime = (time) => {
    if (time) {
      this.setState({ startTime: time.format('HH:mm') });
    }
  }

  changeDuration = (time) => {
    if (time) {
      this.setState({ duration: time.format('HH:mm') });
    }
  }

  changeEditStartTime = (time) => {
    if (time) {
      this.setState({ edit_StartTime: time.format('HH:mm') }, () => {
        this.getEditEnd();
      });
    }
  }

  changeEditDuration = (time) => {
    if (time) {
      this.setState({ edit_Duration: time.format('HH:mm') }, () => {
        this.getEditEnd();
      });
    }
  }

  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      this.setState({ [key]: target.value });
    }
  }

  getNextDays = () => {
    if (this.state.endDate) {
      let startDate = moment(this.state.endDate, 'D/MMM/YYYY').add(1, 'd');
      let endDate = startDate.clone().add(13, 'd');
      this.setState({
        startDate: startDate.format('D/MMM/YYYY'),
        endDate: endDate.format('D/MMM/YYYY')
      });
      this.enumerateDaysBetweenDates(startDate.clone(), endDate.clone());
    }
  }

  getPreviousDays = () => {
    if (this.state.startDate) {
      let endDate = moment(this.state.startDate, 'D/MMM/YYYY').add(-1, 'd');
      let startDate = endDate.clone().add(-13, 'd');
      this.setState({
        startDate: startDate.format('D/MMM/YYYY'),
        endDate: endDate.format('D/MMM/YYYY')
      });
      this.enumerateDaysBetweenDates(startDate.clone(), endDate.clone());
    }
  }

  getLevelList = () => {
    const requestUrl = config.serverUrl + config.api.zonemapping_levels;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          this.setState({
            levelsList: res,
          });
          if (sessionStorage.getItem('role') == 'ROLE_ADMIN') {
            res.forEach((level, index) => {
              if (level.id == this.state.selectedLevel.id) {
                this.setState({
                  currentZonesList: level.zones,
                });
              }
            });
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  addRequest = () => {
    let zone_id = this.state.selectedZone_request.id;
    if (zone_id == -1) {
      if (this.state.permissionZones.length > 0) {
        this.state.permissionZones.map((zone, index) => {
          this.caseOfRecurring(zone.id);
        });
      }
      else {
        alert('This user do not have any permission at this floor');
      }
    }
    else {
      this.caseOfRecurring(this.state.selectedZone_request.id);
    }
  }

  caseOfRecurring = (zone) => {
    if (this.state.chosenRecurringPattern == 'One Time') {
      this.oneTimeRequest(zone);
    }
    else if (this.state.chosenRecurringPattern == 'Weekly') {
      if (this.state.toDay == null) {
        this.setState({
          showAlert: true,
          alertMessage: 'Please select "To Day"'
        },
          () => {
            setTimeout(() => { this.setState({ showAlert: false, alertMessage: null }) }, 3000);
          });
      } else {
        this.weeklyRequest(zone);
      }
    }
    else if (this.state.chosenRecurringPattern == 'Monthly') {
      if (this.state.toDay == null) {
        this.setState({
          showAlert: true,
          alertMessage: 'Please select "To Day"'
        },
          () => {
            setTimeout(() => { this.setState({ showAlert: false, alertMessage: null }) }, 3000);
          });
      } else {
        this.monthlyRequest(zone);
      }
    }
  }

  onCloseAlert = e => {
    this.setState({ showAlert: false, alertMessage: null });
  }

  oneTimeRequest = (zone) => {
    let requestUrl = '';
    if (sessionStorage.getItem('role') == 'ROLE_USER') {
      requestUrl = config.serverUrl + config.api.requests + '/me';
    }
    else {
      const params = {
        username: this.state.selectedUser.username
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      requestUrl = config.serverUrl + config.api.requests + '/' + query;
    }

    let status;
    let dur = moment(this.state.duration, 'HH:mm');
    let dur_hour = dur.get('hour');
    let dur_minute = dur.get('minute');
    let totals = dur_hour * 60 + dur_minute;
    let data = {
      zone_id: zone,
      start_date: moment(this.state.fullChosenDate).format('YYYY-MM-DD'),
      start_time: this.state.startTime,
      duration: totals,
      purpose: this.state.Purpose
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          let string = '';
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            array.push(res.errors[key]);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          if (sessionStorage.getItem('role') != 'ROLE_USER') {
            this.getRequest_2();
          }
          else {
            this.getRequest();
          }
          this.handleClose();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  weeklyRequest = (zone) => {
    let recurring = {};
    this.state.chosenDaysInWeek.forEach((item) => {
      let key = this.state.days[item];
      recurring[key] = true;
    });
    let dur = moment(this.state.duration, 'HH:mm');
    let dur_hour = dur.get('hour');
    let dur_minute = dur.get('minute');
    let totals = dur_hour * 60 + dur_minute;

    let requestUrl = '';
    if (sessionStorage.getItem('role') == 'ROLE_USER') {
      requestUrl = config.serverUrl + config.api.requests + '/me/weekly';
    }
    else {
      const params = {
        username: this.state.selectedUser.username
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      requestUrl = config.serverUrl + config.api.requests + '/' + query + '/weekly';
    }
    let status;
    let data = {
      zone_id: zone,
      from_date: this.state.fromDay,
      to_date: this.state.toDay,
      start_time: this.state.startTime,
      duration: totals,
      purpose: this.state.Purpose,
      recurring_days: recurring
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          let string = '';
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            array.push(res.errors[key]);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
          return;
        }
        else {
          if (sessionStorage.getItem('role') != 'ROLE_USER') {
            this.getRequest_2();
          }
          else {
            this.getRequest();
          }
          this.handleClose();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  monthlyRequest = (zone) => {
    let requestUrl = '';
    if (sessionStorage.getItem('role') == 'ROLE_USER') {
      requestUrl = config.serverUrl + config.api.requests + '/me/monthly';
    }
    else {
      const params = {
        username: this.state.selectedUser.username
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      requestUrl = config.serverUrl + config.api.requests + '/' + query + '/monthly';
    }
    let status;
    let daysList = {};
    this.state.chosenDaysInMonth.map((item, index) => {
      daysList[item] = true;
    });
    let dur = moment(this.state.duration, 'HH:mm');
    let dur_hour = dur.get('hour');
    let dur_minute = dur.get('minute');
    let totals = dur_hour * 60 + dur_minute;
    let data = {
      zone_id: zone,
      from_date: this.state.fromDay,
      to_date: this.state.toDay,
      start_time: this.state.startTime,
      duration: totals,
      purpose: this.state.Purpose,
      recurring_days: daysList
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          let string = '';
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            array.push(res.errors[key]);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          if (sessionStorage.getItem('role') != 'ROLE_USER') {
            this.getRequest_2();
          }
          else {
            this.getRequest();
          }
          this.handleClose();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  editRequest = () => {
    if (this.state.chosenRecurringPattern == 'One Time') {
      this.editOneTimeRequest();
    }
    else if (this.state.chosenRecurringPattern == 'weekly') {
      this.editWeeklyRequest();
    }
    else if (this.state.chosenRecurringPattern == 'monthly') {
      this.editMonthlyRequest();
    }
  }

  editOneTimeRequest = () => {
    let dur = moment(this.state.edit_Duration, 'HH:mm');
    let totals = (dur.get('hour') * 60) + dur.get('minute');
    let requestUrl = '';
    if (sessionStorage.getItem('role') != 'ROLE_USER') {
      requestUrl = config.serverUrl + config.api.requests + '/' + this.state.currentRequest.creator.username;
    }
    else {
      requestUrl = config.serverUrl + config.api.requests + '/me';
    }
    let status;
    let data = {
      zone_id: this.state.selectedZone_request.id,
      start_date: this.state.currentRequest.start_date,
      start_time: moment(this.state.edit_StartTime, 'HH:mm').format('HH:mm'),
      duration: totals,
      purpose: this.state.Purpose,
      old_zone_id: this.state.currentRequest.zone_id,
      old_start_date: this.state.currentRequest.start_date,
      old_start_time: moment(this.state.currentRequest.start_time, 'HH:mm').format('HH:mm'),
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'PUT',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          let string = '';
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            array.push(res.errors[key]);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          if (sessionStorage.getItem('role') != 'ROLE_USER') {
            this.getRequest_2();
          }
          else {
            this.getRequest();
          }
          this.handleCloseA();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  editWeeklyRequest = () => {
    let recurring = {};
    this.state.chosenDaysInWeek.forEach((item) => {
      let key = this.state.days[item];
      recurring[key] = true;
    });
    let dur = moment(this.state.edit_Duration, 'HH:mm');
    let totals = (dur.get('hour') * 60) + dur.get('minute');
    let requestUrl = '';
    if (sessionStorage.getItem('role') != 'USER_ROLE') {
      requestUrl = config.serverUrl + config.api.requests + '/' + this.state.currentRequest.username + '/weekly/' + this.state.currentRequest.id;
    }
    else {
      requestUrl = config.serverUrl + config.api.requests + '/me/weekly/' + this.state.currentRequest.id;
    }
    let status;
    let data = {
      zone_id: this.state.selectedZone_request.id,
      from_date: moment(this.state.fromDay, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      to_date: moment(this.state.toDay, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      start_time: moment(this.state.edit_StartTime, 'HH:mm').format('HH:mm'),
      duration: totals,
      purpose: this.state.Purpose,
      recurring_days: recurring
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'PUT',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          let string = '';
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            array.push(res.errors[key]);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          if (sessionStorage.getItem('role') != 'ROLE_USER') {
            this.getRequest_2();
          }
          else {
            this.getRequest();
          }
          this.handleCloseA();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  editMonthlyRequest = () => {
    let daysList = {};
    this.state.chosenDaysInMonth.map((item, index) => {
      daysList[item] = true;
    });
    let dur = moment(this.state.edit_Duration, 'HH:mm');
    let totals = (dur.get('hour') * 60) + dur.get('minute');
    let requestUrl = '';
    if (sessionStorage.getItem('role') != 'USER_ROLE') {
      requestUrl = config.serverUrl + config.api.requests + '/' + this.state.currentRequest.username + '/monthly/' + this.state.currentRequest.id;
    }
    else {
      requestUrl = config.serverUrl + config.api.requests + '/me/monthly/' + this.state.currentRequest.id;
    }
    let status;
    let data = {
      zone_id: this.state.selectedZone_request.id,
      from_date: moment(this.state.fromDay, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      to_date: moment(this.state.toDay, 'YYYY-MM-DD').format('YYYY-MM-DD'),
      start_time: moment(this.state.edit_StartTime, 'HH:mm').format('HH:mm'),
      duration: totals,
      purpose: this.state.Purpose,
      recurring_days: daysList
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'PUT',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }),
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          let string = '';
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            array.push(res.errors[key]);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          if (sessionStorage.getItem('role') != 'ROLE_USER') {
            if (sessionStorage.getItem('role') != 'ROLE_USER') {
              this.getRequest_2();
            }
            else {
              this.getRequest();
            }
          }
          else {
            this.getRequest();
          }
          this.handleCloseA();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getRequest_2 = () => {
    let onetimeList = [];
    let recurringList = [];
    const date = moment(this.state.fullChosenDate).format('YYYY-MM-DD');
    let i_one = 0;
    let i_recur = 0;
    let l_1 = this.state.allFloorUsers.length;
    let getOneTime = (user) => {
      i_one++;
      const params = {
        username: user
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      const requestUrl = config.serverUrl + config.api.requests + '/' + query + '?date=' + date;

      let status;
      fetch(requestUrl, {
        method: 'GET',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json"
        },
      })
        .then(response => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          if (res.length == 0) {
            if (i_one == l_1) {
              this.setState({
                oneTimeRequest: onetimeList,
              });
            }
          }
          else {
            let i_2 = 0;
            let l_2 = res.length;
            res.forEach((request, index) => {
              if (request.level_id == this.state.selectedLevel.id) {
                onetimeList.push(request);
              }
              if (i_one == l_1 && i_2 == l_2 - 1) {
                this.setState({
                  oneTimeRequest: onetimeList
                });
              }
              i_2++;
            });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };
    let getRecurring = (user) => {
      i_recur++;
      const params = {
        username: user
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      // const requestUrl = config.serverUrl + config.api.requests + '/' + query + '/recurring?date=' + date;
      const requestUrl = config.serverUrl + config.api.requests + '/' + query + '/recurring/related?date=' + date;

      fetch(requestUrl, {
        method: 'GET',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json"
        },
      })
        .then(response => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          if (res.length == 0) {
            if (i_recur == l_1) {
              this.setState({ recurringRequest: recurringList });
            }
          }
          else if (res.length > 0) {
            let i_2 = 0;
            let l_2 = res.length;
            res.forEach((request, index) => {
              if (request.level_id == this.state.selectedLevel.id) {
                if (!some(recurringList, ['id', request.id])) {
                  recurringList.push(request);
                }
              }
              // if (i_2 == l_2 - 1 && i_recur == l_1) {
              //   this.setState({ recurringRequest: recurringList });
              // }
              // else {
              //   i_2++;
              // }
            });
            this.setState({ recurringRequest: recurringList });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };
    let getOneTimeAdmin = () => {
      const requestUrl = config.serverUrl + config.api.requests + '/me/related?date=' + date;
      this.setState({ loadingOneTime: true, loading: true });

      fetch(requestUrl, {
        method: 'GET',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json"
        },
      })
        .then(response => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          res.forEach((request, index) => {
            if (request.level_id == this.state.selectedLevel.id) {
              onetimeList.push(request);
            }
          });
          this.setState({
            oneTimeRequest: onetimeList,
            loadingOneTime: false
          }, () => this.autoSwitchTabs());
        })
        .catch((error) => {
          console.log(error);
        });
    };
    let getRecurringAdmin = () => {
      const requestUrl = config.serverUrl + config.api.requests + '/me/recurring/related?date=' + date;
      this.setState({ loadingRecurring: true, loading: true });

      fetch(requestUrl, {
        method: 'GET',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json"
        },
      })
        .then(response => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          res.forEach((request, index) => {
            if (request.level_id == this.state.selectedLevel.id && !some(recurringList, ['id', request.id])) {
              recurringList.push(request);
            }
          });
          this.setState({
            recurringRequest: recurringList,
            loadingRecurring: false
          }, () => this.autoSwitchTabs());
        })
        .catch((error) => {
          console.log(error);
        });
    };

    // this.state.allFloorUsers.forEach((user, index) => {
    //   getOneTime(user.username);
    // });
    getOneTimeAdmin();
    getRecurringAdmin();
    this.getAllOneTimeRequestsForDates(this.state.dates);
    this.getAllRecurringRequestsForDates(this.state.dates);
  }

  getRequest = () => {
    let onetimeList = [];
    let recurringList = [];
    const date = moment(this.state.fullChosenDate).format('YYYY-MM-DD');
    let getOneTime = () => {
      const requestUrl = config.serverUrl + config.api.requests + '/me/related' + '?date=' + date;
      this.setState({ loadingOneTime: true, loading: true });

      fetch(requestUrl, {
        method: 'GET',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json"
        },
      })
        .then(response => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          res.forEach((request, index) => {
            if (request.level_id == this.state.selectedLevel.id) {
              onetimeList.push(request);
            }
          });
          // this.setState({ oneTimeRequest: onetimeList });
          this.setState({
            oneTimeRequest: onetimeList,
            loadingOneTime: false
          }, () => this.autoSwitchTabs());
        })
        .catch((error) => {
          console.log(error);
        });
    };
    let getRecurring = () => {
      const requestUrl = config.serverUrl + config.api.requests + '/me/recurring/related?date=' + date;
      this.setState({ loadingRecurring: true, loading: true });

      fetch(requestUrl, {
        method: 'GET',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json"
        },
      })
        .then(response => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          res.forEach((request, index) => {
            if (request.level_id == this.state.selectedLevel.id && !some(recurringList, ['id', request.id])) {
              recurringList.push(request);
            }
          });
          this.setState({
            recurringRequest: recurringList,
            loadingRecurring: false
          }, () => this.autoSwitchTabs());
        })
        .catch((error) => {
          console.log(error);
        });
    };
    getOneTime();
    getRecurring();
    this.getAllOneTimeRequestsForDates(this.state.dates);
    this.getAllRecurringRequestsForDates(this.state.dates);
  }

  autoSwitchTabs = () => {
    const {
      loadingOneTime,
      loadingRecurring,
      oneTimeRequest,
      recurringRequest
    } = this.state;

    if (!loadingOneTime && !loadingRecurring) {
      if (oneTimeRequest.length > 0 && recurringRequest.length == 0) {
        this.setState({ activeTab: '1', loading: false });
      } else if (oneTimeRequest.length == 0 && recurringRequest.length > 0) {
        this.setState({ activeTab: '2', loading: false });
      } else {
        this.setState({ loading: false });
      }
    }
  }

  deleteOneTime = (request) => {
    const params = {
      username: request.creator.username
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    let requestUrl = '';
    if (sessionStorage.getItem('role') != 'ROLE_USER') {
      requestUrl = config.serverUrl + config.api.requests + '/' + query;
    }
    else {
      requestUrl = config.serverUrl + config.api.requests + '/me';
    }
    let status;
    let data = {
      zone_id: request.zone_id,
      start_date: request.start_date,
      start_time: moment(request.start_time, 'HH:mm').format('HH:mm')
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
      body: JSON.stringify(data, function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }),
    })
      .then(response => {
        status = response.status;
        if (status != 204) {
          return response.json();
        }
      })
      .then((res) => {
        if (status == 204) {
          if (sessionStorage.getItem('role') != 'ROLE_USER') {
            this.getRequest_2();
          }
          else {
            this.getRequest();
          }
        }
        else {
          alert(res.errors);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  deleteRecurring = (request) => {
    const params = {
      username: request.username
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    let requestUrl = '';
    if (sessionStorage.getItem('role') != 'ROLE_USER') {
      requestUrl = config.serverUrl + config.api.requests + '/' + query + '/recurring/' + request.id;
    }
    else {
      requestUrl = config.serverUrl + config.api.requests + '/me/recurring/' + request.id;
    }
    let status;
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then(response => {
        status = response.status;
        if (status != 204) {
          return response.json();
        }
      })
      .then((res) => {
        if (status == 204) {
          if (sessionStorage.getItem('role') != 'ROLE_USER') {
            this.getRequest_2();
          }
          else {
            this.getRequest();
          }
        }
        else {
          alert(res.errors);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getUserPermission = () => {
    const requestUrl = config.serverUrl + config.api.users + '/me/permissions';
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        this.setState({ permissionsList: res.levels });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getLevelCompanies = () => {
    const params = {
      include_deleted: false,
    };
    const esc = encodeURIComponent
    const query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&')
    const requestUrl_1 = config.serverUrl + config.api.companies_list + '?' + query;
    let status;
    fetch(requestUrl_1, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        let companies = [];
        let companiesList = [];
        if (Array.isArray(res) && res.length > 0) {
          companies = res;
          if (sessionStorage.getItem('role') != 'ROLE_ADMIN') {
            companiesList.push(res[0]);
          }
          else {
            companies.map((company, index) => {
              let permission = company.permissions.levels;
              for (let id in permission) {
                if (permission[id].id == this.state.selectedLevel.id) {
                  let temp = {
                    id: company.id,
                    title: company.title,
                    address: company.address,
                    username: company.username,
                    deleted_at: company.deleted_at,
                    email: company.email,
                    firstname: company.firstname,
                    lastname: company.lastname,
                    note: company.note,
                    role: company.role,
                    username: company.username,
                    zones: permission[id].zones
                  };
                  companiesList.push(temp);
                }
              }
            });
          }
          this.setState({ companiesList: companiesList });
          if (companiesList != []) {
            this.setState({ allFloorUsers: [] });
            let i = 0;
            companiesList.forEach((company, index) => {
              this.getUserList_2(i, companiesList.length, company.id);
              i++;
            });
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getUserList = (id) => {
    const params_1 = {
      id: id,
    };
    const esc = encodeURIComponent
    const query_1 = Object.keys(params_1)
      .map(k => esc(params_1[k]))
      .join('&')
    const params_2 = {
      include_deleted: false,
    };
    const query_2 = Object.keys(params_2)
      .map(k => esc(k) + '=' + esc(params_2[k]))
      .join('&')
    const requestUrl = config.serverUrl + config.api.companies_action + query_1 + '/users?' + query_2;
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        if (Array.isArray(res)) {
          if (res.length > 0) {
            this.setState({
              companyUserList: res,
              selectedUser: res[0]
            }, () => this.getPermission_2());
          }
          else {
            this.setState({
              companyUserList: [],
              selectedUser: {},
              permissionZones: []
            });
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getUserList_2 = (i, length, id) => {
    const params_1 = {
      id: id,
    };
    const esc = encodeURIComponent
    const query_1 = Object.keys(params_1)
      .map(k => esc(params_1[k]))
      .join('&')
    const params_2 = {
      include_deleted: false,
    };
    const query_2 = Object.keys(params_2)
      .map(k => esc(k) + '=' + esc(params_2[k]))
      .join('&')
    const requestUrl = config.serverUrl + config.api.companies_action + query_1 + '/users?' + query_2;
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        if (Array.isArray(res)) {
          let array = this.state.allFloorUsers;
          let j = 0;
          if (res.length > 0) {
            res.forEach((user, index) => {
              array.push(user);
              if (j == res.length - 1) {
                this.setState({
                  allFloorUsers: array,
                });
                if (i == length - 1) {
                  this.getRequest_2();
                }
              }
              j++;
            });
          }
          else {
            if (i == length - 1) {
              this.getRequest_2();
            }
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getPermission = () => {
    let params;
    if (this.state.currentRequest.creator) {
      params = {
        username: this.state.currentRequest.creator.username,
      };
    }
    else {
      params = {
        username: this.state.currentRequest.username,
      };
    }

    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    let requestUrl = '';
    if (sessionStorage.getItem('role') != 'ROLE_USER') {
      requestUrl = config.serverUrl + config.api.users + '/' + query + '/permissions';
    }
    else {
      requestUrl = config.serverUrl + config.api.users + '/me/permissions';
    }
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (Object.keys(res).length != 0) {
          let obj = {};
          res.levels.forEach((item, index) => {
            if (this.state.currentRequest.level_id == item.id) {
              this.setState({
                permissionZones: orderBy(item.zones, [item => item.name.toLowerCase()], ['asc']),
                // permissionZones: item.zones,
                // selectedZone_request: item.zones[0],
              });
            }
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getPermission_2 = () => {
    let params = {
      username: this.state.selectedUser.username,
    };

    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.users + '/' + query + '/permissions';
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (Object.keys(res).length != 0) {
          let obj = {};
          let count = 0;
          res.levels.forEach((item, index) => {
            if (this.state.selectedLevel.id == item.id) {
              count++;
              this.setState({
                permissionZones: orderBy(item.zones, [item => item.name.toLowerCase()], ['asc']),
                // permissionZones: item.zones,
                selectedZone_request: {
                  id: -1,
                  name: 'All Zones'
                },
              });
            }
            if (count == 0) {
              this.setState({
                permissionZones: [],
                selectedZone_request: {
                  id: -1,
                  name: 'All Zones'
                },
              });
            }
          });
        }
        else {
          this.setState({
            permissionZones: [],
            selectedZone_request: {
              id: -1,
              name: 'All Zones'
            },
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  checkMapping = (id) => {
    const requestUrl = config.serverUrl + config.api.zonemapping_zones + id;
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        let setpoint = false;
        let temperature = false;
        let humidity = false;
        let co2 = false;
        res.robjects.forEach((object, index) => {
          if (object.mapping_type == 'MAPPING_TYPE_ZONE_HUMIDITY') {
            humidity = true;
          }
          else if (object.mapping_type == 'MAPPING_TYPE_ZONE_CO2') {
            co2 = true;
          }
        })
        res.wobjects.forEach((object, index) => {
          if (object.mapping_type == 'MAPPING_TYPE_ZONE_SET_POINT') {
            setpoint = true;
          }
          else if (object.mapping_type == 'MAPPING_TYPE_ZONE_TEMPERATURE') {
            temperature = true;
          }
        })
        if (setpoint == false && temperature == false && humidity == false && co2 == false) {
          this.setState({ environment: true });
        }
        else {
          this.setState({ environment: false });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  canSeeActions = () => {
    if (sessionStorage.getItem('role') == 'ROLE_USER') {
      return false;
    }
    return true;
  }

  hideBlueDot = item => {
    const itemDate = moment(`${item.day} ${item.month} ${item.year}`).format('YYYY-MM-DD');

    for (let i = 0; i < this.state.allOneTimeRequests.length; i++) {
      const request = this.state.allOneTimeRequests[i];
      const requestStartDate = moment(request.start_date).format('YYYY-MM-DD');
      if (itemDate == requestStartDate) {
        return false;
      }
    }
    return true;
  }

  hideGreenDot = item => {
    const itemDate = moment(`${item.day} ${item.month} ${item.year}`).format('YYYY-MM-DD');
    const itemDay = this.state.days[moment(itemDate).day()];

    for (let i = 0; i < this.state.allRecurringRequests.length; i++) {
      const request = this.state.allRecurringRequests[i];
      const requestStartDate = moment(request.date_from).format('YYYY-MM-DD');
      const requestEndDate = moment(request.date_to).format('YYYY-MM-DD');
      if (itemDate > requestStartDate && itemDate < requestEndDate && request.recurring_every.includes(itemDay)) {
        return false;
      }
    }
    return true;
  }

  getAllOneTimeRequestsForDates = dates => {
    // 23 May 2019
    const levelId = this.state.selectedLevel.id;
    const startDate = moment(`${dates[0].day} ${dates[0].month} ${dates[0].year}`).format('YYYY-MM-DD');
    const endDate = moment(`${dates[13].day} ${dates[13].month} ${dates[13].year}`).format('YYYY-MM-DD');
    const requestUrl = config.serverUrl + config.api.requests + `/me/related?start_date=${startDate}&end_date=${endDate}`;

    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        const allOneTimeRequests = filter(res, ['level_id', levelId]);
        this.setState({ allOneTimeRequests });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getAllRecurringRequestsForDates = dates => {
    const levelId = this.state.selectedLevel.id;
    const startDate = moment(`${dates[0].day} ${dates[0].month} ${dates[0].year}`).format('YYYY-MM-DD');
    const endDate = moment(`${dates[13].day} ${dates[13].month} ${dates[13].year}`).format('YYYY-MM-DD');
    const requestUrl = config.serverUrl + config.api.requests + `/me/recurring/related?start_date=${startDate}&end_date=${endDate}`;

    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        const allRecurringRequests = filter(res, ['level_id', levelId]);
        this.setState({ allRecurringRequests });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {

    let chosenDate = this.state.chosenDate[0];
    let dates = this.state.dates;
    let dayNames = this.state.dayNames;
    var settings = {
      arrows: false,
      dots: true,
      infinite: false,
      speed: 500,
      touchThreshold: 2000
    };

    let start = moment(this.state.startTime, 'HH:mm');
    let dur = moment(this.state.duration, 'HH:mm');
    let start_hour = start.get('hour');
    let start_minute = start.get('minute');
    let dur_hour = dur.get('hour');
    let dur_minute = dur.get('minute');
    let totals = (start_hour * 60) + (dur_hour * 60) + start_minute + dur_minute;

    let endTime;
    if (totals >= 1440) {
      endTime = moment(0, 'HH:mm').format('HH:mm');
    }
    else {
      let temp = (dur_hour * 60) + dur_minute;
      endTime = start.add(temp, 'm').format('HH:mm');
    }

    let shortSchedulesView = (
      <div className="fpsd-schedules one-day row" >
        {
          this.state.oneTimeRequest.map((request, index) => {
            let dur;
            if (request.duration >= 60) {
              let h = request.duration / 60 | 0;
              let m = request.duration % 60 | 0;
              dur = moment.utc().hours(h).minutes(m).format("HH:mm");
            }
            else {
              dur = moment(request.duration, 'm').format('HH:mm');
            }
            return (
              <div key={uuidv1()} className="col-sm-6 col-md-4">
                <div className="schedule-item">
                  <div className="level">
                    <label>Level/Zone</label>
                    <span>{request.level_name} / {request.zone_name}</span>
                  </div>
                  <div className="requestor">
                    <label>Requestor</label>
                    <span>{request.creator.firstname} {request.creator.lastname}</span>
                  </div>
                  <div className="time">
                    <table>
                      <tbody>
                        <tr>
                          <td>
                            <div className="start-time">
                              <label>Start time</label>
                              <span>{moment(request.start_time, 'HH:mm').format('HH:mm')}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="end-time">
                              <label>End time</label>
                              <span>{moment(request.start_time, 'HH:mm').add(request.duration, 'm').format('HH:mm')}</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <div className="duration">
                              <label>Duration</label>
                              <span>{dur}</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {this.canSeeActions() &&
                    <div className="action">
                      <div className="line"></div>
                      <table>
                        <tbody>
                          <tr>
                            <td width="50%" className="btn-edit" onClick={e => {
                              e.preventDefault();
                              this.handleShowA('One Time', request);
                            }}>
                              {/* <img src="./edit-ico.svg" alt="edit icon" /> */}
                              <div style={{
                                display: 'inline-block',
                                width: 21,
                                height: 20,
                                marginRight: '1.2rem',
                                backgroundImage: 'url(./edit-ico.svg)'
                              }}></div>
                              <span>Edit</span>
                            </td>
                            <td width="50%" className="btn-remove" onClick={e => {
                              e.preventDefault();
                              if (confirm('Delete request: ' + request.level_name + '/' + request.zone_name + ' Requestor: ' + request.creator.firstname + ' ' + request.creator.lastname + ' ?')) {
                                this.deleteOneTime(request);
                              }
                            }}>
                              {/* <img src="./remove-ico.svg" alt="remove icon" /> */}
                              <div style={{
                                display: 'inline-block',
                                width: 21,
                                height: 20,
                                marginRight: '1.2rem',
                                backgroundImage: 'url(./remove-ico.svg)'
                              }}></div>
                              <span>Delete</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              </div>
            )
          })
        }
      </div>
    );

    let longSchedulesView = (
      <div className="fpsd-schedules recurring row">
        {this.state.recurringRequest.map((request, index) => {
          let dur;
          if (request.duration >= 60) {
            let h = request.duration / 60 | 0;
            let m = request.duration % 60 | 0;
            dur = moment.utc().hours(h).minutes(m).format("hh:mm");
          }
          else {
            dur = moment(request.duration, 'm').format('HH:mm');
          }
          return (
            <div key={uuidv1()} className="col-sm-6 col-md-4">
              <div className="schedule-item">
                <div className="level">
                  <table>
                    <tbody>
                      <tr>
                        <td width="50%"><label>ID</label></td>
                        <td width="50%"><label>Level/Zone</label></td>
                      </tr>
                      <tr>
                        <td><span>{request.id}</span></td>
                        <td><span>{request.level_name} / {request.zone_name}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="requestor">
                  <label>Requestor</label>
                  <span>{request.fullname}</span>
                </div>
                <div className="time">
                  <table>
                    <tbody>
                      <tr>
                        <td>
                          <div className="start-time">
                            <label>Start time</label>
                            <span>{moment(request.start, 'HH:mm').format('HH:mm')}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="end-time">
                            <label>End time</label>
                            <span>{moment(request.start, 'HH:mm').add(request.duration, 'm').format('HH:mm')}</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="duration">
                            <label>Duration</label>
                            <span>{dur}</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="recurring-type">
                  <label>Recurring Type</label>
                  <span>{request.recurring_pattern}</span>
                </div>
                <div className="range-recurrence">
                  <label>Range of Recurrence</label>
                  <span>{moment(request.date_from, 'YYYY-MM-DD').format('MMM DD, YYYY')} - {moment(request.date_to, 'YYYY-MM-DD').format('MMM DD, YYYY')}</span>
                </div>
                {this.canSeeActions() &&
                  <div className="action">
                    <div className="line"></div>
                    <table>
                      <tbody>
                        <tr>
                          <td width="50%" className="btn-edit" onClick={e => {
                            e.preventDefault();
                            this.handleShowA(request.recurring_pattern, request);
                          }}>
                            {/* <img src="./edit-ico.svg" alt="edit icon" /> */}
                            <div style={{
                              display: 'inline-block',
                              width: 21,
                              height: 20,
                              marginRight: '1.2rem',
                              backgroundImage: 'url(./edit-ico.svg)'
                            }}></div>
                            <span>Edit</span>
                          </td>
                          <td width="50%" className="btn-remove" onClick={e => {
                            e.preventDefault();
                            if (confirm('Delete request: ' + request.level_name + '/' + request.zone_name + ' Requestor: ' + request.fullname + ' ?')) {
                              this.deleteRecurring(request);
                            }
                          }}>
                            {/* <img src="./remove-ico.svg" alt="remove icon" /> */}
                            <div style={{
                              display: 'inline-block',
                              width: 21,
                              height: 20,
                              marginRight: '1.2rem',
                              backgroundImage: 'url(./remove-ico.svg)'
                            }}></div>
                            <span>Delete</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>
          )
        })}
      </div>
    );

    let daysView = null;
    if (dates && dates.length > 0 && dayNames && dayNames.length > 0 && dates.length == dayNames.length) {
      daysView = dates.map((item, index) => {
        return (
          <li key={'day-' + item.day} className={this.state.chosenDay && this.state.chosenDay == item.day && this.state.chosenMonth && this.state.chosenMonth == item.month ? "dl-item active" : "dl-item"}>
            <div className="dli-name text-capitalize">{dayNames[index]}</div>
            <div className="dli-number">
              <span onClick={this.changeDate.bind(this, item)}>{item.day}</span>
              <div className="day-request">
                <div className="one-time" hidden={this.hideBlueDot(item)}></div>
                {/* <div className="recurring" hidden={this.state.recurringRequest.length === 0}></div> */}
                <div className="recurring" hidden={this.hideGreenDot(item)}></div>
              </div>
            </div>
          </li>
        )
      });
    }

    let daysInMonthView = null;
    if (this.state.chosenMonth && this.state.chosenYear) {
      let startOfMonth = moment().month(this.state.chosenMonth).year(this.state.chosenYear).startOf('month');
      let endOfMonth = moment().month(this.state.chosenMonth).year(this.state.chosenYear).endOf('month');
      let days = [];
      let num = Number(startOfMonth.format('d'));
      let end = Number(endOfMonth.format('D'));
      if (num > 0) {
        for (let i = 0; i < num; i++) {
          let e = (
            <li key={'m-danu-empty' + i} className="m-danu-item empty"><span>empty</span></li>
          );
          days.push(e);

          if (i == num - 1) {
            for (let j = 1; j <= end; j++) {
              let e = (
                <li key={'m-danu-' + j} className="m-danu-item"><span className={this.state.chosenDaysInMonth.indexOf(j) > -1 ? 'active' : ''} onClick={this.toggleDayInMonth.bind(this, j, this.state.chosenDaysInMonth.indexOf(j) > -1)}>{j}</span></li>
              );

              days.push(e);

              if (j == end) {
                daysInMonthView = days;
              }
            }
          }
        }
      } else if (num == 0) {
        for (let j = 1; j <= end; j++) {
          let e = (
            <li key={'m-danu-' + j} className="m-danu-item"><span className={this.state.chosenDaysInMonth.indexOf(j) > -1 ? 'active' : ''} onClick={this.toggleDayInMonth.bind(this, j, this.state.chosenDaysInMonth.indexOf(j) > -1)}>{j}</span></li>
          );
          days.push(e);

          if (j == end) {
            daysInMonthView = days;
          }
        }
      }
    }

    let levelsList;
    let role = sessionStorage.getItem('role');
    if (role == 'ROLE_ADMIN') {
      levelsList = this.state.levelsList.map((level, index) => {
        return (
          <MenuItem key={level.id} eventKey={{ level_info: level, parent: 'level' }} onSelect={this.select} >{level.name}</MenuItem>
        );
      });
    }
    else {
      let levels = new Array();
      this.state.permissionsList.map((permission, index) => {
        let level = {
          id: permission.id,
          name: permission.name,
          zones: permission.zones,
        };
        levels.push(level);
      });
      levelsList = levels.map((level, index) => {
        return (
          <MenuItem key={level.id} eventKey={{ level_info: level, parent: 'level' }} onSelect={this.select} >{level.name}</MenuItem>
        );
      });
    }

    return (
      <div className="floor-plan">
        <Navigation {...this.props} />
        <div className="fp-overview container">
          <div className="go-back">
            <img src="./black-left-arrow.svg" alt="black left arrow icon" onClick={this.goBack} />
          </div>
          <div className="row">
            <div className="col-md-5 h-md">
              <div className="level-dropdown">
                <Dropdown id="fl-locations-dropdown">
                  <Dropdown.Toggle noCaret>
                    <table>
                      <tbody>
                        <tr>
                          <td className="lvl-name">{this.state.selectedLevel.name}</td>
                          <td rowSpan="2"><span className="pull-right"><i className="fa fa-caret-down" aria-hidden="true"></i></span></td>
                        </tr>
                      </tbody>
                    </table>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="super-colors">
                    {levelsList}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
            <div className="col-md-7">
              <div className="level-dropdown">
                <Dropdown id="fl-level-dropdown">
                  <Dropdown.Toggle noCaret>
                    <table>
                      <tbody>
                        <tr>
                          <td className="lvl-name">{this.state.selectedLevel.name}</td>
                          <td rowSpan="2"><span className="pull-right"><i className="fa fa-caret-down" aria-hidden="true"></i></span></td>
                        </tr>
                        <tr>
                          <td className="lvl-position">{this.state.selectedZone.name}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="super-colors">
                    {
                      this.state.currentZonesList.map((zone, index) => {
                        return (
                          <MenuItem key={index} eventKey={{ name: zone.name, id: zone.id, parent: 'zone' }} onSelect={this.select}>{zone.name}</MenuItem>
                        );
                      })}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="zone-map">
                <canvas id="canvas" ref={el => this.myCanvas = el} width={700} height={350} />
              </div>
            </div>
            {/* <div className="col-md-7 h-sm">
              <div className="environment" hidden={this.state.environment}>
                <div className="air-conditions">
                  <div className="ac-header">
                    <img src="./air-cons-ico.svg" alt="air conditions icon"/>
                    <span>Air Conditions</span>
                  </div>
                  <div className="ac-content">
                    <div className="row">
                      <div className="ac-item col-xs-4">
                        <table>
                          <tbody>
                          <tr>
                            <td className="aci-name"><img src="./temperature-ico.svg" alt="temperature icon"/><span>Temperature</span></td>
                          </tr>
                          <tr>
                            <td className="aci-detail">23.4<span className="unit">&deg;C</span></td>
                          </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="ac-item col-xs-4">
                        <table>
                          <tbody>
                          <tr>
                            <td className="aci-name"><img src="./water-drop-ico.svg" alt="temperature icon"/><span>Humidity</span></td>
                          </tr>
                          <tr>
                            <td className="aci-detail">65<span className="unit">%rH</span></td>
                          </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="ac-item col-xs-4">
                        <table>
                          <tbody>
                          <tr>
                            <td className="aci-name"><img src="./co2-ico.svg" alt="temperature icon"/><span>CO&sup2;</span></td>
                          </tr>
                          <tr>
                            <td className="aci-detail">354<span className="unit">ppm</span></td>
                          </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="temp-setpoint">
                  <div className="ts-pseudo">
                    <table>
                      <tbody>
                      <tr>
                        <td className="ts-header" width="45%">
                          <img src="./temperature-ico.svg" alt="temperature icon"/>
                          <span>Temperature Setpoint</span>
                        </td>
                        <td className="text-center" width="10%"><img className="cursor-pointer" src="./plus-ico.svg" alt="plus icon"/></td>
                        <td className="ts-detail text-center" width="40%">23.0<span className="unit">&deg;C</span></td>
                        <td className="text-right" width="5%"><img className="cursor-pointer" src="./minus-ico.svg" alt="minus icon"/></td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
        <div className="fp-schedule container h-sm">
          <div className="fps-calendar">
            <div className="fpsc-header">
              <table>
                <tbody>
                  <tr>
                    <td className="fpsch-text">
                      <img src="./circle-calendar-ico.svg" alt="calendar icon" />
                      <span>After Hour Schedules</span>
                    </td>
                    <td className="fpsch-button">
                      <button type="button" className="btn btn-default btn-custom btn-add-new-schedule" onClick={this.handleShow.bind(this, null)}>
                        <img src="./white-plus-ico.svg" alt="white plus icon" />
                        <span>Add new schedule</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="fpsc-detail">
              <div className="day-navigation">
                <h3>{chosenDate ? chosenDate['month'] + ' ' + chosenDate['year'] : null}</h3>
                <i className="fa fa-chevron-left" onClick={this.getPreviousDays}></i>
                <i className="fa fa-chevron-right" onClick={this.getNextDays}></i>
                <DatePicker value={this.state.chosenDate ? moment(this.state.chosenDay + '/' + this.state.chosenMonth + '/' + this.state.chosenYear, 'D/MMMM/YYYY') : ''} onChange={this.pickDate} placeholder="" />
              </div>
              <div className="day-list">
                <ul>
                  {daysView}
                </ul>
              </div>
            </div>
          </div>
          <div className="fps-detail">
            <div className="fpsd-tabs">
              <span className={this.state.activeTab == "1" ? "tab-item active" : "tab-item"} data-tab-number="1" onClick={this.switchTab}>One Day</span>
              <span className={this.state.activeTab == "2" ? "tab-item active" : "tab-item"} data-tab-number="2" onClick={this.switchTab}>Recurring</span>
            </div>
            {this.state.activeTab == '1'
              ? (
                <Spin spinning={this.state.loading}>
                  {shortSchedulesView}
                </Spin>
              )
              : (
                <Spin spinning={this.state.loading}>
                  {longSchedulesView}
                </Spin>
              )
            }
          </div>
        </div>
        <div className="for-mobile-version">
          <Slider {...settings}>
            <div className="slide-pseudo">
              <div className="environment-mob">
                <div className="air-conditions">
                  <div className="ac-header">
                    <img src="./air-cons-ico.svg" alt="air conditions icon" />
                    <span>Air Conditions</span>
                  </div>
                  <div className="ac-content">
                    <table>
                      <tbody>
                        <tr className="ac-item">
                          <td className="aci-name"><img src="./temperature-ico.svg" alt="temperature icon" /><span>Temperature</span></td>
                          <td className="aci-detail">23.4<span className="unit">&deg;C</span></td>
                        </tr>
                        <tr className="ac-item">
                          <td className="aci-name"><img src="./water-drop-ico.svg" alt="temperature icon" /><span>Humidity</span></td>
                          <td className="aci-detail">65<span className="unit">%rH</span></td>
                        </tr>
                        <tr className="ac-item">
                          <td className="aci-name"><img src="./co2-ico.svg" alt="temperature icon" /><span>CO&sup2;</span></td>
                          <td className="aci-detail">354<span className="unit">ppm</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="temp-setpoint">
                  <div className="ts-pseudo">
                    <div className="tsp-header">
                      <img src="./temperature-ico.svg" alt="temperature icon" />
                      <span>Temperature Setpoint</span>
                    </div>
                    <div className="tsp-body">
                      <table>
                        <tbody>
                          <tr>
                            <td className="text-left" width="33.33%"><img className="cursor-pointer" src="./plus-ico.svg" alt="plus icon" /></td>
                            <td className="tspb-detail text-center" width="33.33%">23.0<span className="unit">&deg;C</span></td>
                            <td className="text-right" width="33.33%"><img className="cursor-pointer" src="./minus-ico.svg" alt="minus icon" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="slide-pseudo">
              <div className="fp-schedule-mob short">
                <div className="pseudo">
                  <div className="fps-calendar">
                    <div className="fpsc-header">
                      <img src="./circle-calendar-ico.svg" alt="calendar icon" />
                      <span>After Hour Schedules</span>
                    </div>
                    <div className="fpsc-recurring-pattern">
                      <p>One-time</p>
                    </div>
                    <div className="fpsc-date">
                      <table>
                        <tbody>
                          <tr>
                            <td className="fpscd-label"><img src="./color-calendar-ico.svg" alt="calendar icon" /><span>Date</span></td>
                            <td className="fpscd-detail text-right">
                              <div className="pseudo">
                                <span>{this.state.fullChosenDate}</span><img src="./forward-arrow-ico.svg" alt="forward arrow" /><DatePicker value={this.state.chosenDate ? moment(this.state.chosenDay + '/' + this.state.chosenMonth + '/' + this.state.chosenYear, 'D/MMMM/YYYY') : ''} onChange={this.pickDate} placeholder="" allowClear={false} />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="fpsc-button">
                      <button type="button" className="btn btn-default btn-custom btn-add-new-schedule" onClick={this.handleShow.bind(this, 'One Time')}>
                        <img src="./white-plus-ico.svg" alt="white plus icon" />
                        <span>Add new schedule</span>
                      </button>
                    </div>
                  </div>
                  <div className="fps-detail">
                    {shortSchedulesView}
                  </div>
                </div>
              </div>
            </div>
            <div className="slide-pseudo">
              <div className="fp-schedule-mob long">
                <div className="pseudo">
                  <div className="fps-calendar">
                    <div className="fpsc-header">
                      <img src="./circle-calendar-ico.svg" alt="calendar icon" />
                      <span>After Hour Schedules</span>
                    </div>
                    <div className="fpsc-recurring-pattern">
                      <p>Recurring</p>
                    </div>
                    <div className="fpsc-button">
                      <button type="button" className="btn btn-default btn-custom btn-add-new-schedule" onClick={this.handleShow.bind(this, 'Weekly')}>
                        <img src="./white-plus-ico.svg" alt="white plus icon" />
                        <span>Add new recurring schedule</span>
                      </button>
                    </div>
                  </div>
                  <div className="fps-detail">
                    {longSchedulesView}
                  </div>
                </div>
              </div>
            </div>
          </Slider>
        </div>
        <Modal show={this.state.showModal} onHide={this.handleClose} dialogClassName="vae-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">New Request</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleClose} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div hidden={sessionStorage.getItem('role') != 'ROLE_ADMIN'} className="f-group companies">
              <label>Tenant</label>
              <Dropdown id="company-dropdown">
                <Dropdown.Toggle noCaret>
                  <table>
                    <tbody>
                      <tr>
                        <td><span className="level">{this.state.selectedCompany ? this.state.selectedCompany.title : ''}</span></td>
                        <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                      </tr>
                    </tbody>
                  </table>
                </Dropdown.Toggle>
                <Dropdown.Menu className="super-colors">
                  {this.state.companiesList.map((company, index) => {
                    return (
                      <MenuItem key={index} eventKey={{ company: company, parent: 'company' }} onSelect={this.select}>{company.title}</MenuItem>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <div hidden={sessionStorage.getItem('role') == 'ROLE_USER'} className="f-group companies">
              <label>User</label>
              <Dropdown id="company-dropdown">
                <Dropdown.Toggle noCaret>
                  <table>
                    <tbody>
                      <tr>
                        <td><span className="level">{this.state.selectedUser ? this.state.selectedUser.firstname : ''} {this.state.selectedUser ? this.state.selectedUser.lastname : ''}</span></td>
                        <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                      </tr>
                    </tbody>
                  </table>
                </Dropdown.Toggle>
                <Dropdown.Menu className="super-colors">
                  <MenuItem key="owner" eventKey={{ user: { address: this.state.selectedCompany.address, deleted_at: this.state.selectedCompany.deleted_at, email: this.state.selectedCompany.email, firstname: this.state.selectedCompany.firstname, lastname: this.state.selectedCompany.lastname, note: this.state.selectedCompany.note, role: this.state.selectedCompany.role, username: this.state.selectedCompany.username }, parent: 'user' }} onSelect={this.select}>{this.state.selectedCompany.firstname + ' ' + this.state.selectedCompany.lastname}</MenuItem>
                  {
                    this.state.companyUserList.map((user, index) => {
                      return (
                        <MenuItem key={index} eventKey={{ user: user, parent: 'user' }} onSelect={this.select}>{user.firstname} {user.lastname}</MenuItem>
                      );
                    })
                  }
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <div className="f-group level-and-zone">
              <table>
                <tbody>
                  <tr>
                    <td width="50%">
                      <div className="levels">
                        <label>Level</label>
                        <Dropdown disabled id="levels-dropdown">
                          <Dropdown.Toggle noCaret>
                            <table>
                              <tbody>
                                <tr>
                                  <td><span className="level">{this.state.selectedLevel.name}</span></td>
                                  <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                </tr>
                              </tbody>
                            </table>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="super-colors">
                            {this.state.levelsList.map((level, index) => {
                              return (
                                <MenuItem key={level.id} eventKey={{ name: level, parent: 'level_dropdown' }} onSelect={this.selectLevel}>{level.name}</MenuItem>
                              )
                            })}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                    <td width="50%">
                      <div className="zones pull-right">
                        <label>Zone</label>
                        <Dropdown id="zones-dropdown">
                          <Dropdown.Toggle noCaret>
                            <table>
                              <tbody>
                                <tr>
                                  <td><span className="level">{this.state.selectedZone_request.name}</span></td>
                                  <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                </tr>
                              </tbody>
                            </table>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="super-colors">
                            <MenuItem eventKey={{ name: 'All Zones', id: -1, parent: 'zone_request' }} onSelect={this.select}>All Zones</MenuItem>
                            {
                              this.state.permissionZones.map((item, index) => {
                                return (
                                  <MenuItem key={index} eventKey={{ name: item.name, id: item.id, parent: 'zone_request' }} onSelect={this.select}>{item.name}</MenuItem>
                                )
                              })}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="f-group time">
              <table>
                <tbody>
                  <tr>
                    <td>
                      <div className="t-item start-time">
                        <label>Start time</label>
                        <TimePicker value={moment(this.state.startTime, 'HH:mm')} format={'HH:mm'} minuteStep={15} placeholder="" inputReadOnly={true} onChange={this.changeStartTime} />
                      </div>
                    </td>
                    <td>
                      <div className="t-item duration">
                        <label>Duration</label>
                        <TimePicker value={moment(this.state.duration, 'HH:mm')} format={'HH:mm'} minuteStep={15} placeholder="" inputReadOnly={true} onChange={this.changeDuration} />
                      </div>
                    </td>
                    <td>
                      <div className="t-item end-time pull-right">
                        <label>End time</label>
                        <span>{endTime}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="f-group recurring-patterns">
              <label>Recurring Patterns</label>
              <Dropdown id="recurring-patterns-dropdown">
                <Dropdown.Toggle noCaret>
                  <table>
                    <tbody>
                      <tr>
                        <td><span className="level">{this.state.chosenRecurringPattern}</span></td>
                        <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                      </tr>
                    </tbody>
                  </table>
                </Dropdown.Toggle>
                <Dropdown.Menu className="super-colors">
                  <MenuItem eventKey={{ name: 'One Time', id: '1' }} onSelect={this.selectRecurringPattern}>One Time</MenuItem>
                  <MenuItem eventKey={{ name: 'Weekly', id: '2' }} onSelect={this.selectRecurringPattern}>Weekly</MenuItem>
                  <MenuItem eventKey={{ name: 'Monthly', id: '3' }} onSelect={this.selectRecurringPattern}>Monthly</MenuItem>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <div className={this.state.chosenRecurringPattern.toLowerCase() == 'weekly' ? 'f-group weekly-calendar' : 'f-group weekly-calendar hidden'}>
              <div className="wc-wrapper row">
                <div className="col-md-6 from-day">
                  <label>From Day</label>
                  <div className="date-dropdown">
                    <DatePicker value={moment(this.state.fromDay, 'YYYY-MM-DD')} format="YYYY-MM-DD" allowClear={false} placeholder="" onChange={this.pickFromDay} />
                  </div>
                </div>
                <div className="col-md-6 to-day">
                  <label>To Day</label>
                  <div className="date-dropdown">
                    <DatePicker
                      // value={moment(this.state.toDay, 'YYYY-MM-DD')}
                      value={this.state.toDay ? moment(this.state.toDay, 'YYYY-MM-DD') : null}
                      format="YYYY-MM-DD"
                      allowClear={false}
                      placeholder=""
                      onChange={this.pickToDay}
                    />
                  </div>
                </div>
              </div>
              <label>Day</label>
              <div className="wc-wrapper row">
                <div className="col-sm-4">
                  <div className="wc-item" onClick={this.toggleDayInWeek.bind(this, 0, this.state.chosenDaysInWeek.indexOf(0) > -1)}>
                    <span>Sun</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(0) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item center" onClick={this.toggleDayInWeek.bind(this, 1, this.state.chosenDaysInWeek.indexOf(1) > -1)}>
                    <span>Mon</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(1) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item right" onClick={this.toggleDayInWeek.bind(this, 2, this.state.chosenDaysInWeek.indexOf(2) > -1)}>
                    <span>Tue</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(2) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item" onClick={this.toggleDayInWeek.bind(this, 3, this.state.chosenDaysInWeek.indexOf(3) > -1)}>
                    <span>Wed</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(3) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item center" onClick={this.toggleDayInWeek.bind(this, 4, this.state.chosenDaysInWeek.indexOf(4) > -1)}>
                    <span>Thu</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(4) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item right" onClick={this.toggleDayInWeek.bind(this, 5, this.state.chosenDaysInWeek.indexOf(5) > -1)}>
                    <span>Fri</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(5) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-4">
                  <div className="wc-item" onClick={this.toggleDayInWeek.bind(this, 6, this.state.chosenDaysInWeek.indexOf(6) > -1)}>
                    <span>Sat</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(6) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={this.state.chosenRecurringPattern.toLowerCase() == 'monthly' ? 'f-group monthly-calendar' : 'f-group monthly-calendar hidden'}>
              <div className="mc-wrapper">
                <div className="row">
                  <div className="col-md-6 from-day">
                    <label>From Day</label>
                    <div className="date-dropdown">
                      <DatePicker value={moment(this.state.fromDay, 'YYYY-MM-DD')} format="YYYY-MM-DD" allowClear={false} placeholder="" onChange={this.pickFromDay} />
                    </div>
                  </div>
                  <div className="col-md-6 to-day">
                    <label>To Day</label>
                    <div className="date-dropdown">
                      <DatePicker
                        value={this.state.toDay ? moment(this.state.toDay, 'YYYY-MM-DD') : null}
                        format="YYYY-MM-DD"
                        allowClear={false}
                        placeholder=""
                        onChange={this.pickToDay}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <label>Day</label>
              <div className="mc-wrapper">
                <div className="m-day-name">
                  <ul>
                    <li className="m-dana-item"><span>Sun</span></li>
                    <li className="m-dana-item"><span>Mon</span></li>
                    <li className="m-dana-item"><span>Tue</span></li>
                    <li className="m-dana-item"><span>Wed</span></li>
                    <li className="m-dana-item"><span>Thu</span></li>
                    <li className="m-dana-item"><span>Fri</span></li>
                    <li className="m-dana-item"><span>Sat</span></li>
                  </ul>
                </div>
                <div className="m-day-number">
                  <ul>
                    {daysInMonthView}
                  </ul>
                </div>
              </div>
            </div>
            <div className="monthly-calendar"></div>
            <div className="f-group purpose">
              <label>Purpose of Request</label>
              <input type="text" placeholder="Some description" data-state-key="Purpose" value={this.state.Purpose} onChange={this.changeValue} />
            </div>
            {this.state.showAlert &&
              <Alert message={this.state.alertMessage} type="error" showIcon closable onClose={this.onCloseAlert} />
            }
            <button className="btn btn-default btn-custom btn-create-request" onClick={this.addRequest}>Request</button>
          </Modal.Body>
        </Modal>
        <Modal show={this.state.showEditModal} onHide={this.handleCloseA} dialogClassName="vae-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Edit Request</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseA} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="f-group level-and-zone">
              <table>
                <tbody>
                  <tr>
                    <td width="50%">
                      <div className="levels">
                        <label>Level</label>
                        <Dropdown disabled id="levels-dropdown">
                          <Dropdown.Toggle noCaret>
                            <table>
                              <tbody>
                                <tr>
                                  <td><span className="level">{this.state.selectedLevel.name}</span></td>
                                  <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                </tr>
                              </tbody>
                            </table>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="super-colors">
                            {this.state.levelsList.map((level, index) => {
                              return (
                                <MenuItem key={level.id} eventKey={{ name: level, parent: 'level_dropdown' }} onSelect={this.selectLevel}>{level.name}</MenuItem>
                              )
                            })}
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                    <td width="50%">
                      <div className="zones pull-right">
                        <label>Zone</label>
                        <Dropdown id="zones-dropdown">
                          <Dropdown.Toggle noCaret>
                            <table>
                              <tbody>
                                <tr>
                                  <td><span className="level">{this.state.selectedZone_request.name}</span></td>
                                  <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                </tr>
                              </tbody>
                            </table>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="super-colors">
                            {
                              this.state.permissionZones.map((item, index) => {
                                return (
                                  <MenuItem key={index} eventKey={{ name: item.name, id: item.id, parent: 'zone_request' }} onSelect={this.select}>{item.name}</MenuItem>
                                );
                              })
                            }
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="f-group time">
              <table>
                <tbody>
                  <tr>
                    <td>
                      <div className="t-item start-time">
                        <label>Start time</label>
                        <TimePicker value={moment(this.state.edit_StartTime, 'HH:mm')} format={'HH:mm'} eventKey={{ paren: 'start_time' }} minuteStep={15} placeholder="" inputReadOnly={true} onChange={this.changeEditStartTime} />
                      </div>
                    </td>
                    <td>
                      <div className="t-item duration">
                        <label>Duration</label>
                        <TimePicker value={moment(this.state.edit_Duration, 'HH:mm')} format={'HH:mm'} eventKey={{ paren: 'duration' }} minuteStep={15} placeholder="" inputReadOnly={true} onChange={this.changeEditDuration} />
                      </div>
                    </td>
                    <td>
                      <div className="t-item end-time pull-right">
                        <label>End time</label>
                        <span>{this.state.edit_End ? this.state.edit_End : ''}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="f-group recurring-patterns">
              <label>Recurring Patterns</label>
              <Dropdown disabled id="recurring-patterns-dropdown">
                <Dropdown.Toggle noCaret>
                  <table>
                    <tbody>
                      <tr>
                        <td><span className="level">{this.state.chosenRecurringPattern}</span></td>
                        <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                      </tr>
                    </tbody>
                  </table>
                </Dropdown.Toggle>
                <Dropdown.Menu className="super-colors">
                  <MenuItem eventKey={{ name: 'One Time', id: '1' }} onSelect={this.selectRecurringPattern}>One Time</MenuItem>
                  <MenuItem eventKey={{ name: 'Weekly', id: '2' }} onSelect={this.selectRecurringPattern}>Weekly</MenuItem>
                  <MenuItem eventKey={{ name: 'Monthly', id: '3' }} onSelect={this.selectRecurringPattern}>Monthly</MenuItem>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <div className={this.state.chosenRecurringPattern.toLowerCase() == 'weekly' ? 'f-group weekly-calendar' : 'f-group weekly-calendar hidden'}>
              <div className="wc-wrapper row">
                <div className="col-md-6 from-day">
                  <label>From Day</label>
                  <div className="date-dropdown">
                    <DatePicker value={moment(this.state.fromDay, 'YYYY-MM-DD')} format="YYYY-MM-DD" allowClear={false} placeholder="" onChange={this.pickFromDay} />
                  </div>
                </div>
                <div className="col-md-6 to-day">
                  <label>To Day</label>
                  <div className="date-dropdown">
                    <DatePicker value={moment(this.state.toDay, 'YYYY-MM-DD')} format="YYYY-MM-DD" allowClear={false} placeholder="" onChange={this.pickToDay} />
                  </div>
                </div>
              </div>
              <label>Day</label>
              <div className="wc-wrapper row">
                <div className="col-sm-4">
                  <div className="wc-item" onClick={this.toggleDayInWeek.bind(this, 0, this.state.chosenDaysInWeek.indexOf(0) > -1)}>
                    <span>Sun</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(0) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item center" onClick={this.toggleDayInWeek.bind(this, 1, this.state.chosenDaysInWeek.indexOf(1) > -1)}>
                    <span>Mon</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(1) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item right" onClick={this.toggleDayInWeek.bind(this, 2, this.state.chosenDaysInWeek.indexOf(2) > -1)}>
                    <span>Tue</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(2) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item" onClick={this.toggleDayInWeek.bind(this, 3, this.state.chosenDaysInWeek.indexOf(3) > -1)}>
                    <span>Web</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(3) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item center" onClick={this.toggleDayInWeek.bind(this, 4, this.state.chosenDaysInWeek.indexOf(4) > -1)}>
                    <span>Thu</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(4) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="wc-item right" onClick={this.toggleDayInWeek.bind(this, 5, this.state.chosenDaysInWeek.indexOf(5) > -1)}>
                    <span>Fri</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(5) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-4">
                  <div className="wc-item" onClick={this.toggleDayInWeek.bind(this, 6, this.state.chosenDaysInWeek.indexOf(6) > -1)}>
                    <span>Sat</span>
                    <div className={this.state.chosenDaysInWeek.indexOf(6) > -1 ? 'check-item active' : 'check-item'}>
                      <div className="pseudo">
                        <img src="./checked-ico.svg" alt="checked icon" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={this.state.chosenRecurringPattern.toLowerCase() == 'monthly' ? 'f-group monthly-calendar' : 'f-group monthly-calendar hidden'}>
              <div className="mc-wrapper">
                <div className="row">
                  <div className="col-md-6 from-day">
                    <label>From Day</label>
                    <div className="date-dropdown">
                      <DatePicker value={moment(this.state.fromDay, 'YYYY-MM-DD')} format="YYYY-MM-DD" allowClear={false} placeholder="" onChange={this.pickFromDay} />
                    </div>
                  </div>
                  <div className="col-md-6 to-day">
                    <label>To Day</label>
                    <div className="date-dropdown">
                      <DatePicker value={moment(this.state.toDay, 'YYYY-MM-DD')} format="YYYY-MM-DD" allowClear={false} placeholder="" onChange={this.pickToDay} />
                    </div>
                  </div>
                </div>
              </div>
              <label>Day</label>
              <div className="mc-wrapper">
                <div className="m-day-name">
                  <ul>
                    <li className="m-dana-item"><span>Sun</span></li>
                    <li className="m-dana-item"><span>Mon</span></li>
                    <li className="m-dana-item"><span>Tue</span></li>
                    <li className="m-dana-item"><span>Wed</span></li>
                    <li className="m-dana-item"><span>Thu</span></li>
                    <li className="m-dana-item"><span>Fri</span></li>
                    <li className="m-dana-item"><span>Sat</span></li>
                  </ul>
                </div>
                <div className="m-day-number">
                  <ul>
                    {daysInMonthView}
                  </ul>
                </div>
              </div>
            </div>
            <div className="monthly-calendar"></div>
            <div className="f-group purpose">
              <label>Purpose of Request</label>
              <input type="text" placeholder="Some description" data-state-key="Purpose" value={this.state.Purpose} onChange={this.changeValue} />
            </div>
            <button className="btn btn-default btn-custom btn-create-request" onClick={this.editRequest}>Save</button>
          </Modal.Body>
        </Modal>
        <Footer />
      </div>
    );
  }
}