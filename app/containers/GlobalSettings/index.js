import React from 'react';
import config from 'config';
import { Dropdown, MenuItem, Modal } from 'react-bootstrap';
import moment from 'moment';
import TimePicker from 'antd/lib/time-picker';
import DatePicker from 'antd/lib/date-picker';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import SettingControl from 'components/SettingControl';
import uuidv1 from 'uuid';

export default class GlobalSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      option24Hours: false,
      optionNormalHours: false,
      optionObjectType: [{ a: true, b: false, c: false, d: false }],
      optionEmailNotifications: false,
      date: moment().format('YYYY-MM-DD'),
      settingList: {},
      publicHoliday: [],
      selectedControlType: null,
      fromDay: 1,
      fromDay_Name: '',
      toDay: 1,
      toDay_Name: '',
      fromTime: '00:00',
      toTime: '00:00',
      priority: 0,
      pollInterval: 0,
      parentKey: '',
      primaryColor: '',
      secondaryColor: '',
      assets: [],
      days: {
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
        7: 'sunday',
      },
      style: {},
      save: true,
    };
  }
  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      if (target.value.length <= 20) {
        this.setState({ [key]: target.value });
      }
    }
  }

  changePrice = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      if (target.value.length <= 20 && !isNaN(target.value)) {
        this.setState({ [key]: target.value });
      }
    }
  }

  toggleOption = (parent, key) => {
    this.setState({ save: false });
    if (parent) {
      const name = `option${parent}`;
      const option = this.state[name];  // array
      const status = option[0][key];
      option[0][key] = !status;
      this.setState({ [name]: option });
    } else {
      const name = `option${key}`;
      const status = this.state[name];
      this.setState({ [name]: !status });
    }
  }

  pickDate = (time) => {
    if (time) {
      this.setState({ date: time.format('YYYY-MM-DD') });
    }
  }

  radioButton = (key, value) => {
    const option = this.state.optionObjectType;
    for (const id in option[0]) {
      if (id == key) {
        option[0][id] = true;
      } else {
        option[0][id] = false;
      }
    }
    this.setState({
      optionObjectType: option,
      selectedControlType: value,
      save: false,
    });
  }

  changeStartTime = (time) => {
    this.setState({ fromTime: time.format('HH:mm') });
  }

  changeEndTime = (time) => {
    this.setState({ toTime: time.format('HH:mm') });
  }

  pickColor_1 = (event) => {
    const code = event.target.value.substr(1);
    this.setState({ primaryColor: code });
  }

  pickColor_2 = (event) => {
    const code = event.target.value.substr(1);
    this.setState({ secondaryColor: code });
  }

  componentDidMount() {
    this.getSettingsList();
  }

  getSettingsList = () => {
    const requestUrl = config.serverUrl + config.api.settings;
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: sessionStorage.getItem('token'),
      },
    })
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (Object.keys(res).length) {
          const x = '#';
          let f_day = '';
          let t_day = '';
          f_day = this.state.days[res.ACDayFrom];
          t_day = this.state.days[res.ACDayTo];
          this.setState({
            building_name: res.Building,
            city: res.City,
            address: res.Address,
            footer_note: res.FooterNote,
            suburb: res.Suburb,
            header_text: res.HeaderText,
            settingList: res,
            selectedControlType: res.BControlType,
            fromDay_Name: f_day.charAt(0).toUpperCase() + f_day.slice(1),
            toDay_Name: t_day.charAt(0).toUpperCase() + t_day.slice(1),
            fromTime: res.ACTimeFrom,
            toTime: res.ACTimeTo,
            priority: res.BWritePriority,
            pollInterval: res.BPollInterval,
            parentKey: uuidv1(),
            primaryColor: res.primary_color,
            secondaryColor: res.secondary_color,
            intervalTime: res.IntervalTime,
            intervalPrice: res.IntervalPrice,
          });

          const option = this.state.optionObjectType;
          for (const id in option[0]) {
            if (res.BControlType == 17) {
              if (id == 'a') {
                option[0][id] = true;
              } else {
                option[0][id] = false;
              }
            } else if (res.BControlType == 3) {
              if (id == 'b') {
                option[0][id] = true;
              } else {
                option[0][id] = false;
              }
            } else if (res.BControlType == 4) {
              if (id == 'c') {
                option[0][id] = true;
              } else {
                option[0][id] = false;
              }
            } else if (res.BControlType == 5) {
              if (id == 'd') {
                option[0][id] = true;
              } else {
                option[0][id] = false;
              }
            }
          }
          this.setState({ optionObjectType: option });

          if (res.TimeFormat == 0) this.setState({ option24Hours: false });
          else this.setState({ option24Hours: true });

          if (res.SetNormHour == 0) this.setState({ optionNormalHours: false });
          else this.setState({ optionNormalHours: true });

          if (!res.enable_notification) this.setState({ optionEmailNotifications: false });
          else this.setState({ optionEmailNotifications: true });
        }
        this.getPublicHoliday();
        this.getAssets();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  upload = (file, type) => {
    const formData = new FormData();
    formData.append('file', file[0]);
    let requestUrl = config.serverUrl + config.api.settings;
    if (type == 'logo') {
      requestUrl += '/logo';
    } else if (type == 'background') {
      requestUrl += '/background';
    } else if (type == 'foreground') {
      requestUrl += '/foreground';
    } else if (type == 'manual') {
      requestUrl += '/manual';
    }
    let status;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        Authorization: sessionStorage.getItem('token'),
      },
      body: formData,
    })
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          const length = Object.keys(res.errors).length;
          const array = new Array();
          let count = 0;
          for (const key in res.errors) {
            const string = res.errors[key];
            array.push(string);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        } else {
          alert(`Upload ${type} Successfully!`);
          if (type != 'manual') {
            this.componentDidMount();
          } else {
            this.getAssets();
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getAssets = () => {
    const requestUrl = `${config.serverUrl + config.api.settings}/assets`;
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        Authorization: sessionStorage.getItem('token'),
      },
    })
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status == 200) {
          this.setState({ assets: res });
          let style = {};
          if (res.background) {
            const url = `${res.background}?k=${uuidv1()}`;
            style = {
              backgroundImage: 'url(' + url + ')',
            };
          } else {
            style = {
              backgroundColor: '#F5F5F5',
            };
          }
          this.setState({ style });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  deleteUploaded = (type) => {
    let requestUrl = config.serverUrl + config.api.settings;
    if (type == 'logo') {
      if (this.state.assets.logo) {
        requestUrl += '/logo';
      } else return;
    } else if (type == 'background') {
      if (this.state.assets.background) {
        requestUrl += '/background';
      } else return;
    } else if (type == 'foreground') {
      if (this.state.assets.foreground) {
        requestUrl += '/foreground';
      } else return;
    } else if (type == 'manual') {
      if (this.state.assets.manual) {
        requestUrl += '/manual';
      } else return;
    }
    let status;
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        'accept': 'application/json',
        Authorization: sessionStorage.getItem('token'),
      },
    })
      .then((response) => {
        status = response.status;
        if (status != 204) {
          return response.json();
        }
      })
      .then((res) => {
        if (status == 204) {
          if (type == 'logo') {
            sessionStorage.removeItem('logo');
          } else if (type == 'foreground') {
            sessionStorage.removeItem('foreground');
          }
          if (type != 'manual' && type != 'foreground') {
            this.componentDidMount();
          } else {
            this.getAssets();
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  setEmailNotifications = () => {
    const requestUrl = config.serverUrl + config.api.notifications;
    const data = {
      enable: true, // this.state.enableNotifications,
    };
    const cache = [];
    let status = null;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Authorization': sessionStorage.getItem('token'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, (key, value) => {
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
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 201) {
          const length = Object.keys(res.errors).length;
          const array = new Array();
          let count = 0;
          for (const key in res.errors) {
            const string = `${key}: ${res.errors[key]}`;
            array.push(string);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        } else {
          alert('Email notifications toggled');
          // this.getPublicHoliday();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  addPublicHoliday = () => {
    if (this.state.holiday_name.length > 0) {
      const requestUrl = `${config.serverUrl + config.api.settings}/holidays`;
      const info = {
        name: this.state.holiday_name,
      };
      const temp = [];
      const data = {
        date: this.state.date,
        description: JSON.stringify(info, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (temp.indexOf(value) !== -1) {
              // Circular reference found, discard key
              return;
            }
            // Store value in our collection
            temp.push(value);
          }
          return value;
        }),
      };
      const cache = [];
      let status;
      let errors;
      fetch(requestUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': sessionStorage.getItem('token'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data, (key, value) => {
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
        .then((response) => {
          status = response.status;
          return response.json();
        })
        .then((res) => {
          if (status != 200) {
            const length = Object.keys(res.errors).length;
            const array = new Array();
            let count = 0;
            for (const key in res.errors) {
              const string = `${key}: ${res.errors[key]}`;
              array.push(string);
              count++;
              if (count == length) {
                const f = array.join('\n');
                alert(f);
              }
            }
          } else {
            this.setState({
              holiday_name: '',
            });
            alert('Added new holiday successfully');
            this.getPublicHoliday();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      alert('Please fill all required fields');
    }
  }

  getPublicHoliday = () => {
    let status;
    const requestUrl = `${config.serverUrl + config.api.settings}/holidays`;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': sessionStorage.getItem('token'),
      },
    })
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (Array.isArray(res)) this.setState({ publicHoliday: res });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  deletePublicHoliday = (date) => {
    const requestUrl = `${config.serverUrl + config.api.settings}/holidays`;
    const data = {
      date,
    };
    const cache = [];
    let status;
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: sessionStorage.getItem('token'),
      },
      body: JSON.stringify(data, (key, value) => {
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
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          alert(res.errors);
        }
        this.getPublicHoliday();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  select = (eventKey) => {
    this.setState({ save: false });
    if (eventKey.parent == 'fromDay') {
      this.setState({
        fromDay: eventKey.id,
        fromDay_Name: eventKey.name,
      });
    } else if (eventKey.parent == 'toDay') {
      this.setState({
        toDay: eventKey.id,
        toDay_Name: eventKey.name,
      });
    } else if (eventKey.parent == 'priority') {
      this.setState({ priority: eventKey.id });
    } else if (eventKey.parent == 'poll_interval') {
      this.setState({ pollInterval: eventKey.id });
    } else if (eventKey.parent == 'interval') {
      this.setState({ intervalTime: eventKey.value });
    }
  }

  saveGlobalSettings = () => {
    let timeFormat = 0;
    let normalHour = 0;
    if (this.state.option24Hours == true) timeFormat = 1;
    else timeFormat = 0;

    if (this.state.optionNormalHours == true) normalHour = 1;
    else normalHour = 0;

    const requestUrl = config.serverUrl + config.api.settings;
    const data = {
      ACDayFrom: this.state.fromDay,
      ACDayTo: this.state.toDay,
      ACTimeFrom: this.state.fromTime,
      ACTimeTo: this.state.toTime,
      Address: this.state.address,
      BGColor: '',
      BControlType: this.state.selectedControlType,
      BPollInterval: this.state.pollInterval,
      BWritePriority: this.state.priority,
      Building: this.state.building_name,
      City: this.state.city,
      FooterNote: this.state.footer_note,
      HeaderText: this.state.header_text,
      IntervalPrice: parseFloat(this.state.intervalPrice).toFixed(2).toString(),
      IntervalTime: this.state.intervalTime,
      SetNormHour: normalHour,
      Suburb: this.state.suburb,
      TimeFormat: timeFormat,
      primary_color: this.state.primaryColor,
      secondary_color: this.state.secondaryColor,
      enable_notification: this.state.optionEmailNotifications,
    };
    const cache = [];
    let status = null;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': sessionStorage.getItem('token'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data, (key, value) => {
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
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          const length = Object.keys(res.errors).length;
          const array = new Array();
          let count = 0;
          for (const key in res.errors) {
            const string = `${key}: ${res.errors[key]}`;
            array.push(string);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        } else {
          this.componentDidMount();
          this.setState({ save: true });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  clearBACnet = () => {
    const requestUrl = `${config.serverUrl + config.api.settings}/clear_bacnet`;
    let status;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Authorization': sessionStorage.getItem('token'),
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status != 200) {
          const length = Object.keys(res.errors).length;
          const array = new Array();
          let count = 0;
          for (const key in res.errors) {
            const string = `${key}: ${res.errors[key]}`;
            array.push(string);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        } else this.componentDidMount();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  search2 = () => {
    if (this.device.value.length > 0) {
      const regex = /^[0-9]+$/;
      if (this.device.value.match(regex)) {
        const requestUrl = `${config.serverUrl + config.api.zonemapping_zones}search/${this.device.value}`;
        let status = 0;
        fetch(requestUrl, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            Authorization: sessionStorage.getItem('token'),
          },
        })
          .then((response) => {
            status = response.status;
            if (status != 204) {
              return response.json();
            }
          })
          .then((res) => {
            if (status == 204) {
              alert('New IPC command added');
            } else {
              const length = Object.keys(res.errors).length;
              const array = new Array();
              let count = 0;
              for (const key in res.errors) {
                const string = res.errors[key];
                array.push(string);
                count++;
                if (count == length) {
                  const f = array.join('\n');
                  alert(f);
                }
              }
            }
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        alert('Device ID must be a number');
      }
    }
  }

  render() {
    const holidaysList = this.state.publicHoliday.map((item, index) => {
      const info_text = item.description;
      const info = JSON.parse(info_text);
      return (
        <div key={index} className="hl-item">
          <table>
            <tbody>
              <tr>
                <td width="25%"><span>{info.name}</span></td>
                <td width="25%"><span>{item.date}</span></td>
                <td width="10%" className="text-right">
                  <div className="delete-holiday">
                    <img
                      src="./trash-ico.svg" alt="delete holiday" onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Delete holiday: ${item.date} ?`)) {
                          this.deletePublicHoliday(item.date);
                        }
                      }}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )
        ;
    }
    );
    return (
      <div key={this.state.parentKey} className="global-settings">
        <Navigation {...this.props} />
        <SettingControl {...this.props} />
        <div className="gs-wrapper" style={this.state.style}>
          <div className="building-details container">
            <div className="bd-pseudo">
              <h4>Building Details</h4>
              <div className="bd-content">
                <div className="row">
                  <div className="col-md-6">
                    <div className="building-name">
                      <div className="title">
                        <img src="./building-ico-2.svg" alt="building icon" />
                        <span>Building Name</span>
                      </div>
                      <div className="value">
                        <input
                          type="text" data-state-key="building_name" value={this.state.building_name} onChange={(e) => {
                            this.changeValue(e);
                            this.setState({ save: false });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="city-state">
                      <div className="title">
                        <img src="./city-ico.svg" alt="building icon" />
                        <span>City, State</span>
                      </div>
                      <div className="value">
                        <input
                          data-state-key="city" value={this.state.city} onChange={(e) => {
                            this.changeValue(e);
                            this.setState({ save: false });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="street-address">
                      <div className="title">
                        <img src="./direction-sign-ico.svg" alt="building icon" />
                        <span>Street Address</span>
                      </div>
                      <div className="value">
                        <input
                          data-state-key="address" value={this.state.address} onChange={(e) => {
                            this.changeValue(e);
                            this.setState({ save: false });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="footer-note">
                      <div className="title">
                        <img src="./notes-ico.svg" alt="building icon" />
                        <span>Footer Note</span>
                      </div>
                      <div className="value">
                        <input
                          data-state-key="footer_note" value={this.state.footer_note} onChange={(e) => {
                            this.changeValue(e);
                            this.setState({ save: false });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="Suburb">
                      <div className="title">
                        <img src="./bank-ico.svg" alt="building icon" />
                        <span>Suburb</span>
                      </div>
                      <div className="value">
                        <input
                          data-state-key="suburb" value={this.state.suburb} onChange={(e) => {
                            this.changeValue(e);
                            this.setState({ save: false });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="time-and-holiday container">
            <div className="tah-pseudo">
              <div className="row">
                <div className="col-md-6">
                  <h4>Set Time Format</h4>
                  <div className="time">
                    <div className="twenty-four-hours">
                      <span>24 Hour Time</span>
                      <div className={this.state.option24Hours ? 'check-item active' : 'check-item'}>
                        <div className="pseudo" onClick={this.toggleOption.bind(this, null, '24Hours')}>
                          <img src="./checked-ico.svg" alt="check box" />
                        </div>
                      </div>
                    </div>
                    <div className="normal-hours-settings">
                      <div className="header">
                        <span>Use Setting Normal Hours</span>
                        <div className={this.state.optionNormalHours ? 'check-item active' : 'check-item'}>
                          <div className="pseudo" onClick={this.toggleOption.bind(this, null, 'NormalHours')}>
                            <img src="./checked-ico.svg" alt="check box" />
                          </div>
                        </div>
                      </div>
                      <div className="content">
                        <div className="normal-hours-day">
                          <div className="title">
                            <img src="./calendar-ico-2.svg" alt="calendar icon" />
                            <span>Normal Hour Days</span>
                          </div>
                          <div className="value">
                            <table>
                              <tbody>
                                <tr>
                                  <td width="12%" className="text-up"><label>From</label></td>
                                  <td width="35%">
                                    <div className="day-dropdown">
                                      <Dropdown id="day-dropdown-1">
                                        <Dropdown.Toggle noCaret>
                                          <table>
                                            <tbody>
                                              <tr>
                                                <td><span className="level">{this.state.fromDay_Name}</span></td>
                                                <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="super-colors">
                                          <MenuItem eventKey={{ parent: 'fromDay', name: 'Monday', id: '1' }} onSelect={this.select}>Monday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'fromDay', name: 'Tuesday', id: '2' }} onSelect={this.select}>Tuesday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'fromDay', name: 'Wednesday', id: '3' }} onSelect={this.select}>Wednesday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'fromDay', name: 'Thursday', id: '4' }} onSelect={this.select}>Thursday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'fromDay', name: 'Friday', id: '5' }} onSelect={this.select}>Friday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'fromDay', name: 'Saturday', id: '6' }} onSelect={this.select}>Saturday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'fromDay', name: 'Sunday', id: '7' }} onSelect={this.select}>Sunday</MenuItem>
                                        </Dropdown.Menu>
                                      </Dropdown>
                                    </div>
                                  </td>
                                  <td width="10%"></td>
                                  <td width="8%" className="text-up"><label>To</label></td>
                                  <td width="35%">
                                    <div className="day-dropdown">
                                      <Dropdown id="day-dropdown-2">
                                        <Dropdown.Toggle noCaret>
                                          <table>
                                            <tbody>
                                              <tr>
                                                <td><span className="level">{this.state.toDay_Name}</span></td>
                                                <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="super-colors">
                                          <MenuItem eventKey={{ parent: 'toDay', name: 'Monday', id: '1' }} onSelect={this.select}>Monday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'toDay', name: 'Tuesday', id: '2' }} onSelect={this.select}>Tuesday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'toDay', name: 'Wednesday', id: '3' }} onSelect={this.select}>Wednesday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'toDay', name: 'Thursday', id: '4' }} onSelect={this.select}>Thursday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'toDay', name: 'Friday', id: '5' }} onSelect={this.select}>Friday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'toDay', name: 'Saturday', id: '6' }} onSelect={this.select}>Saturday</MenuItem>
                                          <MenuItem eventKey={{ parent: 'toDay', name: 'Sunday', id: '7' }} onSelect={this.select}>Sunday</MenuItem>
                                        </Dropdown.Menu>
                                      </Dropdown>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="normal-hours-time">
                          <div className="title">
                            <img src="./clock-ico.svg" alt="calendar icon" />
                            <span>Normal Hour Times</span>
                          </div>
                          <div className="value">
                            <table>
                              <tbody>
                                <tr>
                                  <td width="12%" className="text-up"><label>From</label></td>
                                  <td width="35%">
                                    <div className="time-dropdown">
                                      <TimePicker defaultValue={moment(this.state.settingList.ACTimeFrom, 'HH:mm')} value={moment(this.state.fromTime, 'HH:mm')} eventKey={{ paren: 'from' }} format={'HH:mm'} minuteStep={5} inputReadOnly placeholder="" onChange={this.changeStartTime} />
                                    </div>
                                  </td>
                                  <td width="10%"></td>
                                  <td width="8%" className="text-up"><label>To</label></td>
                                  <td width="35%">
                                    <div className="time-dropdown">
                                      <TimePicker defaultValue={moment(this.state.settingList.ACTimeTo, 'HH:mm')} value={moment(this.state.toTime, 'HH:mm')} eventKey={{ paren: 'to' }} format={'HH:mm'} minuteStep={5} inputReadOnly placeholder="" onChange={this.changeEndTime} />
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="tp-wrapper">
                    <h4>Request Time - Interval & Price</h4>
                    <div className="time-price row">
                      <div className="col-sm-6">
                        <div className="title">
                          <span>Time Interval</span>
                        </div>
                        <div className="time-dropdown">
                          <Dropdown id="interval-time">
                            <Dropdown.Toggle noCaret>
                              <table>
                                <tbody>
                                  <tr>
                                    <td><span className="level">{this.state.intervalTime != 60 ? `${this.state.intervalTime} minutes` : '1 hour'}</span></td>
                                    <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                  </tr>
                                </tbody>
                              </table>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="super-colors">
                              <MenuItem eventKey={{ parent: 'interval', value: 15 }} onSelect={this.select}>15 minutes</MenuItem>
                              <MenuItem eventKey={{ parent: 'interval', value: 30 }} onSelect={this.select}>30 minutes</MenuItem>
                              <MenuItem eventKey={{ parent: 'interval', value: 60 }} onSelect={this.select}>1 hour</MenuItem>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="title">
                          <span>Price p/15min</span>
                        </div>
                        <span class="currencyinput">
                          $
                          <input
                            value={this.state.intervalPrice}
                            data-state-key="intervalPrice"
                            className="price"
                            onChange={(e) => {
                              this.changePrice(e);
                              this.setState({ save: false });
                            }}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="">
                    <h4>Email</h4>
                    <div className="email">
                      <div className="email-notifications">
                        <span>Enable Notifications</span>
                        <div className={this.state.optionEmailNotifications ? 'check-item active' : 'check-item'}>
                          <div
                            className="pseudo"
                            onClick={this.toggleOption.bind(this, null, 'EmailNotifications')}
                          >
                            <img src="./checked-ico.svg" alt="check box" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <h4>Public Holidays</h4>
                  <div className="holiday">
                    <div className="new-public-holiday">
                      <div className="header">
                        <span>New Public Holiday</span>
                      </div>
                      <div className="content">
                        <div className="add-holiday">
                          <div className="row">
                            <div className="col-sm-6">
                              <div className="ah-name">
                                <label>Public Holiday Name</label>
                                <input type="text" data-state-key="holiday_name" value={this.state.holiday_name} onChange={this.changeValue} />
                              </div>
                            </div>
                            <div className="col-sm-6">
                              <div className="ah-date">
                                <label>Date</label>
                                <div className="date-dropdown">
                                  <DatePicker value={moment(this.state.date, 'YYYY-MM-DD')} format="YYYY-MM-DD" allowClear={false} placeholder="" onChange={this.pickDate} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <button type="button" className="btn btn-default btn-custom btn-add-holiday" onClick={this.addPublicHoliday}>Add holiday</button>
                        </div>
                        <div className="holiday-list">
                          <div className="pseudo">
                            <div className="hl-header">
                              <table>
                                <tbody>
                                  <tr>
                                    <td width="25%"><span>Public Holiday</span></td>
                                    <td width="25%"><span>Date</span></td>
                                    <td width="10%"></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            {holidaysList}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="object-and-theme container">
            <div className="oat-pseudo">
              <div className="row">
                <div className="col-md-6">
                  <h4>BACnet Object Type</h4>
                  <div className="object">
                    <div className="control-type">
                      <div className="header">
                        <span>Control Type</span>
                      </div>
                      <div className="content options">
                        <div className="op-item">
                          <span>Schedule Object</span>
                          <div className={this.state.optionObjectType[0].a ? 'check-item active' : 'check-item'}>
                            <div className="pseudo" onClick={this.radioButton.bind(this, 'a', 17)}>
                              <img src="./checked-ico.svg" alt="check box" />
                            </div>
                          </div>
                        </div>
                        <div className="op-item">
                          <span>Binary Input</span>
                          <div className={this.state.optionObjectType[0].b ? 'check-item active' : 'check-item'}>
                            <div className="pseudo" onClick={this.radioButton.bind(this, 'b', 3)}>
                              <img src="./checked-ico.svg" alt="check box" />
                            </div>
                          </div>
                        </div>
                        <div className="op-item">
                          <span>Binary Output</span>
                          <div className={this.state.optionObjectType[0].c ? 'check-item active' : 'check-item'}>
                            <div className="pseudo" onClick={this.radioButton.bind(this, 'c', 4)}>
                              <img src="./checked-ico.svg" alt="check box" />
                            </div>
                          </div>
                        </div>
                        <div className="op-item">
                          <span>Binary Value</span>
                          <div className={this.state.optionObjectType[0].d ? 'check-item active' : 'check-item'}>
                            <div className="pseudo" onClick={this.radioButton.bind(this, 'd', 5)}>
                              <img src="./checked-ico.svg" alt="check box" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="priority">
                      <Dropdown id="priority-object-dropdown">
                        <Dropdown.Toggle noCaret>
                          <table>
                            <tbody>
                              <tr>
                                <td><span className="p-name">Priority</span></td>
                                <td><span className="p-value pull-right">{this.state.priority}</span></td>
                                <td width="10%"><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                              </tr>
                            </tbody>
                          </table>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="super-colors">
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '1' }} onSelect={this.select}>1</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '2' }} onSelect={this.select}>2</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '3' }} onSelect={this.select}>3</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '4' }} onSelect={this.select}>4</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '5' }} onSelect={this.select}>5</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '6' }} onSelect={this.select}>6</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '7' }} onSelect={this.select}>7</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '8' }} onSelect={this.select}>8</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '9' }} onSelect={this.select}>9</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '10' }} onSelect={this.select}>10</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '11' }} onSelect={this.select}>11</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '12' }} onSelect={this.select}>12</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '13' }} onSelect={this.select}>13</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '14' }} onSelect={this.select}>14</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '1', id: '15' }} onSelect={this.select}>15</MenuItem>
                          <MenuItem eventKey={{ parent: 'priority', name: '16', id: '16' }} onSelect={this.select}>16</MenuItem>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className="poll-interval">
                      <Dropdown id="poll-interval-dropdown">
                        <Dropdown.Toggle noCaret>
                          <table>
                            <tbody>
                              <tr>
                                <td><span className="pi-name">Poll Interval</span></td>
                                <td><span className="pi-value pull-right">{this.state.pollInterval} minutes</span></td>
                                <td width="10%"><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                              </tr>
                            </tbody>
                          </table>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="super-colors">
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '1' }} onSelect={this.select}>1 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '2' }} onSelect={this.select}>2 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '3' }} onSelect={this.select}>3 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '4' }} onSelect={this.select}>4 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '5' }} onSelect={this.select}>5 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '6' }} onSelect={this.select}>6 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '7' }} onSelect={this.select}>7 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '8' }} onSelect={this.select}>8 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '9' }} onSelect={this.select}>9 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '10' }} onSelect={this.select}>10 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '11' }} onSelect={this.select}>11 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '12' }} onSelect={this.selec}>12 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '13' }} onSelect={this.select}>13 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '14' }} onSelect={this.select}>14 minutes</MenuItem>
                          <MenuItem eventKey={{ parent: 'poll_interval', name: '15 minutes', id: '15' }} onSelect={this.select}>15 minutes</MenuItem>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className="search-device">
                      <div className="row">
                        <div className="col-sm-8">
                          <label>Search device</label>
                          <input ref={(c) => this.device = c} />
                        </div>
                        <div className="col-sm-4">
                          <button type="button" className="btn btn-default btn-custom btn-search-device" onClick={this.search2}>Search</button>
                        </div>
                      </div>
                    </div>
                    <button type="button" className="btn btn-default btn-custom btn-clear-bacnet" onClick={this.clearBACnet}>Clear BACnet</button>
                  </div>
                </div>
                <div className="col-md-6">
                  <h4>Theme</h4>
                  <div className="theme">
                    <div className="primary-colour">
                      <div className="row">
                        <div className="col-sm-8">
                          <span>Primary Colour</span>
                        </div>
                        <div className="col-sm-4">
                          <div className="pc-value">
                            <div className="color" style={{ backgroundColor: '#'.concat(this.state.primaryColor) }}></div>
                            <span className="color-code">#{this.state.primaryColor}</span>
                            <div>
                              <input
                                type="color" className="upload" onChange={(e) => {
                                  this.pickColor_1(e);
                                  this.setState({ save: false });
                                }}
                              />
                              <img src="./color-picker-ico.svg" alt="color picker" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="secondary-colour">
                      <div className="row">
                        <div className="col-sm-8">
                          <span>Secondary Colour</span>
                        </div>
                        <div className="col-sm-4">
                          <div className="pc-value">
                            <div className="color" style={{ backgroundColor: '#'.concat(this.state.secondaryColor) }}></div>
                            <span className="color-code">#{this.state.secondaryColor}</span>
                            <div>
                              <input
                                type="color" className="upload" onChange={(e) => {
                                  this.pickColor_2(e);
                                  this.setState({ save: false });
                                }}
                              />
                              <img src="./color-picker-ico.svg" alt="color picker" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="header-text">
                      <div className="row">
                        <div className="col-sm-8">
                          <span>Header Text</span>
                        </div>
                        <div className="col-sm-4">
                          <div className="ht-value">
                            <input
                              data-state-key="header_text" value={this.state.header_text} onChange={(e) => {
                                this.changeValue(e);
                                this.setState({ save: false });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="logo">
                      <div className="row">
                        <div className="col-sm-9">
                          <span>Logo</span>
                        </div>
                        <div className="col-sm-3">
                          <input
                            ref="ip_1" className="upload" type="file" onChange={(e) => {
                              this.upload(e.target.files, 'logo');
                            }}
                          />
                          <button
                            className="btn btn-default btn-attachment" onClick={(e) => {
                              e.preventDefault();
                              this.refs.ip_1.click();
                            }}
                          >
                            <img src="./attachment-ico.svg" alt="attachment" />
                            <span>Attachment</span>
                          </button>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-4 image-box">
                          <img
                            hidden={!this.state.assets.logo} className="icon-delete" src="./global-icon-delete.png" alt="icon-delete" onClick={(e) => {
                              e.preventDefault();
                              this.deleteUploaded('logo');
                            }}
                          />
                          {this.state.assets.logo ? <img className="img-border" src={`${this.state.assets.logo}?k=${uuidv1()}`} alt="img-box" /> : <div className="img-border" />}
                        </div>
                      </div>
                    </div>
                    <div className="background">
                      <div className="row">
                        <div className="col-sm-9">
                          <span>Background</span>
                        </div>
                        <div className="col-sm-3">
                          <input
                            ref="ip_2" className="upload" type="file" onChange={(e) => {
                              this.upload(e.target.files, 'background');
                            }}
                          />
                          <button
                            className="btn btn-default btn-attachment" onClick={(e) => {
                              e.preventDefault();
                              this.refs.ip_2.click();
                            }}
                          >
                            <img src="./attachment-ico.svg" alt="attachment" />
                            <span>Attachment</span>
                          </button>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-4 image-box">
                          <img
                            hidden={!this.state.assets.background}
                            className="icon-delete"
                            src="./global-icon-delete.png"
                            alt="icon-delete"
                            onClick={(e) => {
                              e.preventDefault();
                              this.deleteUploaded('background');
                            }}
                          />
                          {this.state.assets.background ? <img className="img-border" src={`${this.state.assets.background}?k=${uuidv1()}`} alt="img-box" /> : <div className="img-border" />}
                        </div>
                      </div>
                    </div>
                    <div className="front-image">
                      <div className="row">
                        <div className="col-sm-9">
                          <span>Front Image</span>
                        </div>
                        <div className="col-sm-3">
                          <input
                            ref="ip_3" className="upload" type="file" onChange={(e) => {
                              this.upload(e.target.files, 'foreground');
                            }}
                          />
                          <button
                            className="btn btn-default btn-attachment" onClick={(e) => {
                              e.preventDefault();
                              this.refs.ip_3.click();
                            }}
                          >
                            <img src="./attachment-ico.svg" alt="attachment" />
                            <span>Attachment</span>
                          </button>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-4 image-box">
                          <img
                            hidden={!this.state.assets.foreground} className="icon-delete" src="./global-icon-delete.png" alt="icon-delete" onClick={(e) => {
                              e.preventDefault();
                              this.deleteUploaded('foreground');
                            }}
                          />
                          {this.state.assets.foreground ? <img className="img-border" src={`${this.state.assets.foreground}?k=${uuidv1()}`} alt="img-box" /> : <div className="img-border" />}
                        </div>
                      </div>
                    </div>
                    <div className="user-manual">
                      <div className="row">
                        <div className="col-sm-9">
                          <span>User Manual</span>
                        </div>
                        <div className="col-sm-3">
                          <input
                            ref="ip_4" className="upload" type="file" onChange={(e) => {
                              this.upload(e.target.files, 'manual');
                            }}
                          />
                          <button
                            className="btn btn-default btn-attachment" onClick={(e) => {
                              e.preventDefault();
                              this.refs.ip_4.click();
                            }}
                          >
                            <img src="./attachment-ico.svg" alt="attachment" />
                            <span>Attachment</span>
                          </button>
                        </div>
                      </div>
                      <div className="row">
                        <div className="link-box">
                          {this.state.assets.manual ? (<a target="_blank" className="link-border" href={this.state.assets.manual}>{this.state.assets.manual}</a>) : (<a
                            className="link-border" href="#" onClick={(e) => {
                              e.preventDefault();
                            }}
                          >No Link</a>)}
                          <img
                            hidden={!this.state.assets.manual} src="./circle-trash-ico.svg" className="btn-delete-global" alt="trash icon" onClick={(e) => {
                              e.preventDefault();
                              this.deleteUploaded('manual');
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="save container">
            <div className="buttons" onClick={this.saveGlobalSettings}>
              <div className="row text-center">
                <button hidden={this.state.save} type="button" className="btn btn-default btn-custom btn-add-tenant">
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer {...this.props} />
      </div>
    );
  }
}
