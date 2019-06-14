import React from 'react';
import config from 'config';
import { Dropdown, MenuItem, Modal } from 'react-bootstrap';
import Panel from 'react-bootstrap/lib/Panel';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import SettingControl from 'components/SettingControl';
import uuidv1 from 'uuid';

export default class ZoneMapping extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddNewLevelModal: false,
      showAddNewZoneModal: false,
      showEditLevelProfile: false,
      showEditZoneProfile: false,
      selectedZone: '0',
      selectedZone_Name: '',
      currentZone: {},
      levelsList: [],
      devicesList: [],
      currentLevel_Name: '',
      currentLevel_Id: 0,
      currentLevelZones: [],
      zone_name: '',
      zone_unit: '',
      level_name: '',
      currentMapped: [],
      devicesCheckList: {},
      localFilter: '',
      objectFilter: {},
      mapping_type: 'MAPPING_TYPE_AHAC_NORMAL_HOUR',
      AHAC_Read: false,
      AHAC_write: false,
      Zone_Set: false,
      Zone_Temp: false,
      Zone_Humid: false,
      Zone_CO2: false,
      selectedLevel: {}
    };
  }

  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      this.setState({ [key]: target.value });
    }
  }

  handleCloseA = () => {
    this.setState({ showAddNewLevelModal: false });
  };

  handleShowA = (type) => {
    this.setState({ showAddNewLevelModal: true });
  };

  handleCloseB = () => {
    this.setState({ showEditZoneProfile: false });
  };

  handleShowB = () => {
    this.setState({
      zone_name: this.state.currentZone.name,
      zone_unit: this.state.currentZone.unit,
      showEditZoneProfile: true
    });
  };

  handleShowC = () => {
    this.setState({ showAddNewZoneModal: true });
  };

  handleCloseC = () => {
    this.setState({ showAddNewZoneModal: false });
  };

  handleShowD = () => {
    this.setState({
      level_name: this.state.currentLevel_Name,
      showEditLevelProfile: true
    });
  };

  handleCloseD = () => {
    this.setState({ showEditLevelProfile: false });
  };

  changeObjectFilter = (id, value) => {
    let filter = this.state.objectFilter;
    filter = {};
    filter[id] = value;
    this.setState({ objectFilter: filter });
  }

  toggleOptions = (parent, key) => {
    let name = 'option' + parent;
    let option = this.state[name];
    let status = option[0][key];
    option[0][key] = !status;
    this.setState({ [name]: option });
  }

  checkDevice = (obj, obj_name) => {
    let temp = this.state.devicesCheckList;
    if (temp[obj_name]) {
      if (temp[obj_name].device_id == obj.device_id && temp[obj_name].object_id == obj.object_id && temp[obj_name].object_type == obj.object_type) {
        delete temp[obj_name];
      }
      else {
        for (let key in temp) {
          if (temp[key].device_id == obj.device_id) {
            delete temp[key];
          }
        }
        temp[obj_name] = obj;
      }
    }
    else {
      for (let key in temp) {
        if (temp[key].device_id == obj.device_id) {
          delete temp[key];
        }
      }
      temp[obj_name] = obj;
    }
    this.setState({ devicesCheckList: temp });
  }

  selectMappingType = (type) => {
    this.setState({ mapping_type: type }, () => {
      this.checkMatchWithMappingType();
    });
  }

  checkMatchWithMappingType = () => {
    if (this.state.currentMapped && this.state.currentMapped.length > 0 && this.state.mapping_type) {
      let array = this.state.currentMapped;
      let type;
      let isWrite = false;
      if (this.state.mapping_type == 'MAPPING_TYPE_AHAC_ENABLE') {
        type = 'MAPPING_TYPE_AHAC_NORMAL_HOUR';
        isWrite = true;
      }
      else {
        type = this.state.mapping_type;
        if (type == 'MAPPING_TYPE_AHAC_NORMAL_HOUR' || type == 'MAPPING_TYPE_ZONE_HUMIDITY' || type == 'MAPPING_TYPE_ZONE_CO2') {
          isWrite = false;
        }
        else {
          isWrite = true;
        }
      }

      let obj = {};
      let i = 0;
      array.forEach((item, index) => {
        if (item.mapping_type == type && item.write_object == isWrite) {
          let string = item.device_id.toString() + '-' + item.object_id.toString() + '-' + item.object_type.toString();
          let temp = {
            device_id: item.device_id,
            object_id: item.object_id,
            object_type: item.object_type
          };
          obj[string] = temp;
        }
        if (i == array.length - 1) {
          this.setState({ devicesCheckList: obj });
        }
        i++;
      });
    }
  }

  selectZone = (zone_id, zone_name, zone_unit) => {
    if (zone_id) {
      let temp = {};
      if (zone_id != '0' && zone_name != '0' && zone_unit != '0') {
        temp = {
          id: zone_id,
          name: zone_name,
          unit: zone_unit
        };
      }
      this.setState({
        currentZone: temp,
        selectedZone: zone_id,
        selectedZone_Name: zone_name,
        zone_name: zone_name,
        zone_unit: zone_unit,
        devicesCheckList: {}
      }, () => {
        if (this.state.selectedZone != 0) {
          this.getMappingTypesStatus();
        }
      });
    }
  }

  componentDidMount() {
    this.getLevel();
    this.getDevicesList();
  }

  getMappingTypesStatus = () => {
    const requestUrl_1 = config.serverUrl + config.api.zonemapping_zones + this.state.selectedZone;
    let status;
    fetch(requestUrl_1, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        if (res.robjects.length == 0) {
          this.setState({
            AHAC_Read: false,
            Zone_Humid: false,
            Zone_CO2: false
          });
        }
        else {
          let temp = {
            AHAC_Read: false,
            Zone_Humid: false,
            Zone_CO2: false,
          };
          let i = 0;
          res.robjects.forEach((object, index) => {
            if (object.mapping_type == 'MAPPING_TYPE_AHAC_NORMAL_HOUR') {
              temp.AHAC_Read = true;
            }
            else if (object.mapping_type == 'MAPPING_TYPE_ZONE_HUMIDITY') {
              temp.Zone_Humid = true;
            }
            else if (object.mapping_type == 'MAPPING_TYPE_ZONE_CO2') {
              temp.Zone_CO2 = true;
            }
            if (i == res.robjects.length - 1) {
              this.setState(temp);
            }
            i++;
          })
        }
        if (res.wobjects.length == 0) {
          this.setState({
            AHAC_Write: false,
            Zone_Set: false,
            Zone_Temp: false
          });
        }
        else {
          let temp = {
            AHAC_Write: false,
            Zone_Set: false,
            Zone_Temp: false,
          };
          let i = 0;
          res.wobjects.forEach((object, index) => {
            if (object.mapping_type == 'MAPPING_TYPE_AHAC_NORMAL_HOUR') {
              temp.AHAC_Write = true;
            }
            else if (object.mapping_type == 'MAPPING_TYPE_ZONE_SET_POINT') {
              temp.Zone_Set = true;
            }
            else if (object.mapping_type == 'MAPPING_TYPE_ZONE_TEMPERATURE') {
              temp.Zone_Temp = true;
            }
            if (i == res.wobjects.length - 1) {
              this.setState(temp);
            }
            i++
          })
        }
        if (res.robjects.length == 0 && res.wobjects.length == 0) {
          this.setState({ currentMapped: [] });
        }
        else {
          let array = [];
          if (res.robjects.length > 0) {
            res.robjects.forEach((obj, index) => {
              let object = {
                device_id: obj.deviceid,
                object_id: obj.objectid,
                object_type: obj.objecttype,
                write_object: obj.writeobject,
                mapping_type: obj.mapping_type
              };
              array.push(object);
            })
          }
          if (res.wobjects.length > 0) {
            res.wobjects.forEach((obj, index) => {
              let object = {
                device_id: obj.deviceid,
                object_id: obj.objectid,
                object_type: obj.objecttype,
                write_object: obj.writeobject,
                mapping_type: obj.mapping_type
              };
              array.push(object);
            })
          }
          this.setState({
            currentMapped: array,
            mapping_type: 'MAPPING_TYPE_AHAC_NORMAL_HOUR'
          }, () => {
            this.checkMatchWithMappingType();
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getDevicesList = () => {
    const requestUrl_1 = config.serverUrl + config.api.zonemapping_devices;
    let status;
    fetch(requestUrl_1, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          this.setState({ devicesList: res.filter(item => item.name) });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getLevel = () => {
    const requestUrl = config.serverUrl + config.api.zonemapping_levels;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
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
            selectedLevel: res[0],
            currentLevel_Id: res[0].id,
            currentLevel_Name: res[0].name
          }, () => this.getListZones());
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  addLevel = () => {
    if (this.level_Name.value.length > 0) {
      const requestUrl = config.serverUrl + config.api.zonemapping_levels;
      let data = {
        name: this.level_Name.value,
      }
      let status;
      let cache = [];
      fetch(requestUrl, {
        method: 'POST',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json",
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
            let length = Object.keys(res.errors).length;
            let array = new Array();
            let count = 0;
            for (let key in res.errors) {
              let string = key + ': ' + res.errors[key];
              array.push(string);
              count++;
              if (count == length) {
                const f = array.join('\n');
                alert(f);
              }
            }
          }
          else {
            this.handleCloseA();
            this.componentDidMount();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  editLevel = () => {
    const params = {
      id: this.state.currentLevel_Id,
    }
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.zonemapping_levels + '/' + query;
    let status;
    let data = {
      name: this.state.level_name
    };
    let cache = [];
    fetch(requestUrl, {
      method: 'PUT',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json",
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
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            let string = key + ': ' + res.errors[key];
            array.push(string);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          this.getLevel();
          this.handleCloseD();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  deleteLevel = () => {
    const params = {
      id: this.state.currentLevel_Id,
    }
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.zonemapping_levels + '/' + query;
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
          this.getLevel();
        }
        else {
          alert(res.errors);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getListZones = () => {
    const params = {
      id: this.state.currentLevel_Id,
    }
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.zonemapping_levels + '/' + query + '/zones';
    let status;
    let cache = [];
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json",
      },
    })
      .then(response => {
        return response.json();
        /* status = response.status;*/
      })
      .then((res) => {
        if (Array.isArray(res)) {
          this.setState({
            currentLevelZones: res,
            selectedZone: '0'
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  addZone = () => {
    if (this.zone_Name.value.length > 0 && this.zone_unit.value.length > 0) {
      const params = {
        id: this.state.currentLevel_Id,
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      const requestUrl = config.serverUrl + config.api.zonemapping_levels + '/' + query + '/zones';
      let data = {
        name: this.zone_Name.value,
        unit: this.zone_unit.value
      };
      let status;
      let cache = [];
      fetch(requestUrl, {
        method: 'POST',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json",
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
            let length = Object.keys(res.errors).length;
            let array = new Array();
            let count = 0;
            for (let key in res.errors) {
              let string = key + ': ' + res.errors[key];
              array.push(string);
              count++;
              if (count == length) {
                const f = array.join('\n');
                alert(f);
              }
            }
          }
          else {
            this.getListZones();
            this.handleCloseC();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else {
      alert('Please fill all required fields');
    }
  }

  editZone = () => {
    if (this.state.zone_name.length > 0) {
      const params = {
        id: this.state.currentZone.id,
      }
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      const requestUrl = config.serverUrl + config.api.zonemapping_zones + query;
      let status;
      let data = {
        name: this.state.zone_name,
        unit: this.state.zone_unit
      };
      let cache = [];
      fetch(requestUrl, {
        method: 'PUT',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token'),
          "Content-Type": "application/json",
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
            let length = Object.keys(res.errors).length;
            let array = new Array();
            let count = 0;
            for (let key in res.errors) {
              let string = key + ': ' + res.errors[key];
              array.push(string);
              count++;
              if (count == length) {
                const f = array.join('\n');
                alert(f);
              }
            }
          }
          else {
            this.getListZones();
            this.handleCloseB();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else {
      alert('Zone name must not empty');
    }
  }

  deleteZone = (zone_id) => {
    const params = {
      id: zone_id,
    }
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.zonemapping_zones + query;
    let status;
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json",
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
          this.getListZones();
        }
        else {
          alert(res.errors);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  mapObjectAPI = (obj) => {
    const requestUrl = config.serverUrl + config.api.zonemapping_zones + this.state.selectedZone + '/objects';
    let data = obj;
    let status;
    let cache = [];
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json",
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
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for (let key in res.errors) {
            let string = res.errors[key];
            array.push(string);
            count++;
            if (count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          this.setState({ devicesCheckList: {} });
          this.getMappingTypesStatus();
          alert('Mapping Object To Zone Successfully!');
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  mapOjectToZone = () => {
    let temp = this.state.devicesCheckList;
    if (Object.keys(temp).length > 0) {
      let array = [];
      let i = 0;
      for (let key in temp) {
        if (this.state.mapping_type != 'MAPPING_TYPE_AHAC_ENABLE') {
          temp[key]['mapping_type'] = this.state.mapping_type;
        }
        else {
          temp[key]['mapping_type'] = 'MAPPING_TYPE_AHAC_NORMAL_HOUR';
        }
        if (this.state.mapping_type == 'MAPPING_TYPE_AHAC_NORMAL_HOUR' || this.state.mapping_type == 'MAPPING_TYPE_ZONE_HUMIDITY' || this.state.mapping_type == 'MAPPING_TYPE_ZONE_CO2') {
          temp[key]['write_object'] = false;
        }
        else {
          temp[key]['write_object'] = true;
        }
        let obj = temp[key];
        array.push(obj);
        if (i == Object.keys(temp).length - 1) {
          let mapped = this.state.currentMapped;
          if (mapped.length > 0) {
            let j = 0;
            mapped.forEach((object, index) => {
              array.push(object);
              if (j == mapped.length - 1) {
                this.mapObjectAPI(array);
              }
              j++;
            });
          }
          else {
            this.mapObjectAPI(array);
          }
        }
        i++;
      }
    }
  }

  search1 = (deviceId) => {
    const requestUrl = config.serverUrl + config.api.zonemapping_zones + 'search/' + deviceId;
    fetch(requestUrl, {
      method: 'GET',
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
          alert('New IPC command added');
          this.getDevicesList();
          this.getMappingTypesStatus();
        }
        else {
          alert(res.errors);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    let zonesVisible;
    if (this.state.selectedZone == '0') {
      zonesVisible = (
        <div className="col-lg-7 detail">
          <div className="pseudo">
            <table className="all-zone">
              <tbody>
                <tr>
                  <td className="zone-name">
                    <img src="./building-ico.svg" alt="" />
                    <span>Zone Name</span>
                  </td>
                  <td className="vav-unit">
                    <img src="./pencil-ruler-ico.svg" alt="" />
                    <span>VAV Unit</span>
                  </td>
                  <td className="vav-unit edit">
                    <img src="./design-pencil-ruler-grid-guide.svg" alt="" />
                    <span>Edit/Delete</span>
                  </td>
                </tr>
                {this.state.currentLevelZones.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td className="zn-value">
                        <span>{item.name}</span>
                      </td>
                      <td className="vaun-value">
                        <span>{item.unit}</span>
                      </td>
                      <td className="action-zone">
                        <img src="./btn-edit-profile.png" className="btn-edit" alt="edit icon" onClick={e => {
                          e.preventDefault();
                          this.setState({ currentZone: item }, () => this.handleShowB());
                        }} />
                        <img src="./btn-delete.png" className="btn-delete" alt="trash icon" onClick={e => {
                          e.preventDefault();
                          let level = this.state.selectedLevel;
                          if (level.outline != null) {
                            alert('This level have FloorMap already. Cant delete its zone');
                          }
                          else {
                            if (confirm('Delete zone: ' + item.name + ' of level: ' + this.state.currentLevel_Name + ' ?')) {
                              this.deleteZone(item.id);
                            }
                          }
                        }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    else {
      zonesVisible = this.state.currentLevelZones.filter((data, index) => data.id == this.state.selectedZone).map((item, index) => {
        return (
          <div key={index} className="col-sm-5 detail">
            <div className="pseudo">
              <table className="one-zone">
                <tbody>
                  <tr>
                    <td className="zone-name">
                      <img src="./building-ico.svg" alt="" />
                      <span>Zone Name</span>
                    </td>
                    <td className="vav-unit">
                      <img src="./pencil-ruler-ico.svg" alt="" />
                      <span>VAV Unit</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="zn-value">
                      <span>{item.name}</span>
                    </td>
                    <td className="vaun-value">
                      <span>{item.unit}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      });
    }
    const levelItem = this.state.levelsList.map((item, index) => {
      return (
        <MenuItem key={index} onSelect={e => {
          this.setState({
            selectedLevel: item,
            currentLevel_Name: item.name,
            currentLevel_Id: item.id,
            currentZone: {},
            selectedZone: '0',
            selectedZone_Name: ''
          }, () => this.getListZones());
        }} >{item.name}</MenuItem>
      );
    });
    const zonesList = this.state.currentLevelZones.map((item, index) => {
      return (
        <li key={item.id} className={this.state.selectedZone == item.id ? 'zl-item active' : 'zl-item'}>
          <div className="pseudo" onClick={this.selectZone.bind(this, item.id, item.name, item.unit)}>
            <i className="fa fa-circle"></i><span>{item.name}</span>
          </div>
        </li>
      )
    })
    return (
      <div className="zone-mapping">
        <Navigation {...this.props} />
        <SettingControl {...this.props} />
        <div className="zm-detail container">
          <div className="zmd-pseudo">
            <div className="row">
              <div className="col-md-3">
                <div className="left-sidebar">
                  <div className="level-dropdown">
                    <Dropdown id="zm-level-dropdown">
                      <Dropdown.Toggle noCaret>
                        <table>
                          <tbody>
                            <tr>
                              <td className="lvl-name">{this.state.currentLevel_Name.length > 9 ? this.state.currentLevel_Name.substring(0, 7) + '...' : this.state.currentLevel_Name}</td>

                              <td className="lvl-action" rowSpan="2">
                                <td className="edit">
                                  <button className="btnEdit" onClick={e => {
                                    e.stopPropagation();
                                    this.handleShowD();
                                  }}>
                                    <img src="./btn-edit-profile-2.png" alt="edit icon" />
                                  </button>
                                  <button className="btnDelete" onClick={e => {
                                    e.stopPropagation();
                                    if (confirm('Delete level: ' + this.state.currentLevel_Name + ' ?')) {
                                      this.deleteLevel();
                                    }
                                  }}>
                                    <img src="./btn-delete-2.png" alt="trash icon" />
                                  </button>
                                </td>
                                <td>
                                  <span className="pull-right"><i className="fa fa-caret-down" aria-hidden="true"></i></span>
                                </td>
                              </td>
                            </tr>
                            <tr>
                              <td className="lvl-position">{this.state.selectedZone != '0' ? (this.state.selectedZone_Name.length > 12 ? this.state.selectedZone_Name.substring(0, 12) + '...' : this.state.selectedZone_Name) : ''}</td>
                            </tr>
                          </tbody>
                        </table>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="super-colors">
                        {levelItem}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                  <div className="zone-list">
                    <ul>
                      <li className={this.state.selectedZone == '0' ? 'zl-item active' : 'zl-item'}>
                        <div className="pseudo" onClick={this.selectZone.bind(this, '0', '0', '0')}>
                          <i className="fa fa-circle"></i><span>All Zone</span>
                        </div>
                      </li>
                      {zonesList}
                    </ul>
                  </div>
                  <div className="action">
                    <div className="add-zone" hidden={this.state.selectedZone != '0'}>
                      <button type="button" className="btn btn-default btn-custom btn-add-level" onClick={e => {
                        e.preventDefault();
                        let level = this.state.selectedLevel;
                        if (level.outline != null) {
                          alert('This level have FloorMap already. Cant add new zone');
                        }
                        else {
                          this.handleShowC();
                        }
                      }}>
                        <img src="./plus-square-ico.svg" alt="plus ico" />
                        <span>Add Zone</span>
                      </button>
                    </div>
                    <div className="add-level">
                      <button type="button" className="btn btn-default btn-custom btn-add-level" onClick={this.handleShowA}>
                        <img src="./plus-square-ico.svg" alt="plus ico" />
                        <span>Add Level</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-9">
                <div className="zone-profile">
                  <div className="row">
                    <div className="col-sm-5 header">
                      <span>Zone - Profile</span>
                    </div>
                    <div className="col-sm-7 actions">
                      <div className="row">
                        <div className="col-sm-6">
                          <button hidden={this.state.selectedZone == '0'} className="btn btn-default btn-custom btn-edit-profile" onClick={e => {
                            this.handleShowB();
                          }}>
                            <table>
                              <tbody>
                                <tr>
                                  <td><span>Edit zone profile</span></td>
                                  <td><img src="./white-edit-ico.svg" alt="edit zone profile" /></td>
                                </tr>
                              </tbody>
                            </table>
                          </button>
                        </div>
                        <div className="col-sm-6">
                          <button hidden={this.state.selectedZone == '0'} className="btn btn-default btn-custom btn-delete-zone" onClick={e => {
                            e.preventDefault();
                            let level = this.state.selectedLevel;
                            if (level.outline != null) {
                              alert('This level have FloorMap already. Cant delete its zone');
                            }
                            else {
                              if (confirm('Delete zone: ' + this.state.selectedZone_Name + ' of level: ' + this.state.currentLevel_Name + ' ?')) {
                                this.deleteZone(this.state.currentZone.id);
                              }
                            }
                          }}>
                            <table>
                              <tbody>
                                <tr>
                                  <td><span>Delete Zone</span></td>
                                  <td><img src="./white-remove-ico.svg" alt="delete zone" /></td>
                                </tr>
                              </tbody>
                            </table>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    {zonesVisible}
                  </div>
                </div>
                <div hidden={this.state.selectedZone == 0} className="zone-options">
                  <div className="zo-pseudo">
                    <div className="row">
                      <div className="pseudo left">
                        <div className="option-item">
                          <div className={this.state.mapping_type == 'MAPPING_TYPE_AHAC_NORMAL_HOUR' ? 'check-item active' : 'check-item'} onClick={e => {
                            e.preventDefault();
                            this.selectMappingType('MAPPING_TYPE_AHAC_NORMAL_HOUR');
                          }}>
                            <img src="./checked-ico.svg" alt="check icon" />
                          </div>
                          <span>AHAC Normal Hour (Read)</span>
                          <div className="status-item">
                            <img src={this.state.AHAC_Read ? 'check-ico-2.png' : 'check-ico-1.png'} alt="check icon" />
                          </div>
                        </div>
                        <div className="option-item" >
                          <div className={this.state.mapping_type == 'MAPPING_TYPE_AHAC_ENABLE' ? 'check-item active' : 'check-item'} onClick={e => {
                            e.preventDefault();
                            this.selectMappingType('MAPPING_TYPE_AHAC_ENABLE');
                          }}>
                            <img src="./checked-ico.svg" alt="check icon" />
                          </div>
                          <span>AHAC Enable (Write)</span>
                          <div className="status-item">
                            <img src={this.state.AHAC_Write ? 'check-ico-2.png' : 'check-ico-1.png'} alt="check icon" />
                          </div>
                        </div>
                        <div className="option-item">
                          <div className={this.state.mapping_type == 'MAPPING_TYPE_ZONE_SET_POINT' ? 'check-item active' : 'check-item'} onClick={e => {
                            e.preventDefault();
                            this.selectMappingType('MAPPING_TYPE_ZONE_SET_POINT');
                          }}>
                            <img src="./checked-ico.svg" alt="check icon" />
                          </div>
                          <span>Zone Setpoint (Write)</span>
                          <div className="status-item" >
                            <img src={this.state.Zone_Set ? 'check-ico-2.png' : 'check-ico-1.png'} alt="check icon" />
                          </div>
                        </div>
                      </div>
                      <div className="pseudo right">
                        <div className="option-item">
                          <div className={this.state.mapping_type == 'MAPPING_TYPE_ZONE_TEMPERATURE' ? 'check-item active' : 'check-item'} onClick={e => {
                            e.preventDefault();
                            this.selectMappingType('MAPPING_TYPE_ZONE_TEMPERATURE');
                          }}>
                            <img src="./checked-ico.svg" alt="check icon" />
                          </div>
                          <span>Zone Temperature (Write)</span>
                          <div className="status-item">
                            <img src={this.state.Zone_Temp ? 'check-ico-2.png' : 'check-ico-1.png'} alt="check icon" />
                          </div>
                        </div>
                        <div className="option-item">
                          <div className={this.state.mapping_type == 'MAPPING_TYPE_ZONE_HUMIDITY' ? 'check-item active' : 'check-item'} onClick={e => {
                            e.preventDefault();
                            this.selectMappingType('MAPPING_TYPE_ZONE_HUMIDITY');
                          }}>
                            <img src="./checked-ico.svg" alt="check icon" />
                          </div>
                          <span>Zone Humidity (Read)</span>
                          <div className="status-item" >
                            <img src={this.state.Zone_Humid ? 'check-ico-2.png' : 'check-ico-1.png'} alt="check icon" />
                          </div>
                        </div>
                        <div className="option-item">
                          <div className={this.state.mapping_type == 'MAPPING_TYPE_ZONE_CO2' ? 'check-item active' : 'check-item'} onClick={e => {
                            e.preventDefault();
                            this.selectMappingType('MAPPING_TYPE_ZONE_CO2');
                          }}>
                            <img src="./checked-ico.svg" alt="check icon" />
                          </div>
                          <span>Zone CO2(Read)</span>
                          <div className="status-item" >
                            <img src={this.state.Zone_CO2 ? 'check-ico-2.png' : 'check-ico-1.png'} alt="check icon" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div hidden={this.state.selectedZone == 0} className="zone-controller">
                  <div className="zc-pseudo">
                    <div className="zc-header">
                      <div className="row">
                        <div className="col-sm-7 zch-text">
                          <span>BACnet Controller</span>
                        </div>
                        <div className="col-sm-5 zch-search">
                          <div className="pseudo">
                            <input type="text" placeholder="Filter" data-state-key="localFilter" onChange={this.changeValue} />
                            <img src="./search-ico.svg" alt="search icon" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="zc-content">
                      {this.state.devicesList.length > 0 ? this.state.devicesList.filter(data => data.name.toLowerCase().indexOf(this.state.localFilter.toLowerCase()) != -1).map((device, index) => {
                        return (
                          <Panel key={index} eventKey={device.id} expanded={this.state[device.name]} onToggle={() => {
                            this.setState({ [device.name]: !this.state[device.name] });
                          }} >
                            <Panel.Heading>
                              <Panel.Toggle componentClass="div">
                                <table>
                                  <tbody>
                                    <tr>
                                      <td><span className="name">{device.name}</span></td>
                                      <td className="object-search">
                                        <div className="pseudo">
                                          <input type="text" placeholder="Filter" value={this.state.objectFilter[device.id] ? this.state.objectFilter[device.id] : ''} onChange={e => {
                                            e.preventDefault();
                                            this.changeObjectFilter(device.id, e.target.value)
                                          }} onClick={e => {
                                            e.stopPropagation();
                                          }} />
                                        </div>
                                      </td>
                                      <td className="text-right">
                                        <div className="search" onClick={e => {
                                          e.stopPropagation();
                                          this.search1(device.id);
                                        }}>
                                          <span>Scan</span>
                                        </div>
                                        <i className="fa fa-caret-down"></i>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </Panel.Toggle>
                            </Panel.Heading>
                            <Panel.Body collapsible>
                              <div className="zcc-panel">
                                <div className="content">
                                  {device.objects && device.objects.length > 0 ? device.objects.filter(data => data.name.toLowerCase().indexOf(this.state.objectFilter[device.id] ? this.state.objectFilter[device.id].toLowerCase() : '') != -1).map((object, num) => {
                                    let string = object.device_id.toString() + '-' + object.id.toString() + '-' + object.type.toString();
                                    return (
                                      <div key={num} className="row">
                                        <div className="c-item">
                                          <div className="pseudo">
                                            <table>
                                              <tbody>
                                                <tr>
                                                  <td className="default-icon"><img src="./document-ico.svg" alt="document icon" /></td>
                                                  <td><span className="name">{object.name}</span></td>
                                                  <td className="text-right">
                                                    <div className={this.state.devicesCheckList[string] ? (this.state.devicesCheckList[string] ? 'check-item active' : 'check-item') : 'check-item'} onClick={e => {
                                                      e.preventDefault();
                                                      let obj = {
                                                        device_id: object.device_id,
                                                        object_id: object.id,
                                                        object_type: object.type,
                                                      };
                                                      let name = string;
                                                      this.checkDevice(obj, name);
                                                    }}>
                                                      <img src="./checked-ico.svg" alt="check icon" />
                                                    </div>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }) : []}
                                </div>
                              </div>
                            </Panel.Body>
                          </Panel>
                        );
                      }) : []}
                    </div>
                    <div className="zc-actions">
                      <button className="btn btn-default btn-custom btn-search-network" onClick={e => {
                        e.preventDefault();
                        this.search1(0);
                      }}>Scan network</button>
                      <button className="btn btn-default btn-custom btn-map-object" onClick={this.mapOjectToZone}>Map Object</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal show={this.state.showAddNewLevelModal} onHide={this.handleCloseA} dialogClassName="add-new-level-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">New Level</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseA} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="level">
              <label>Level Name</label>
              <input type="text" ref={level_Name => this.level_Name = level_Name} autoFocus />
            </div>
          </Modal.Body>
          <button className="btn btn-default btn-custom btn-save" onClick={this.addLevel}>Save</button>
        </Modal>
        <Modal show={this.state.showEditZoneProfile} onHide={this.handleCloseB} dialogClassName="edit-zone-profile-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Edit Zone Profile</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseB} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="zone-profile">
              <label>Zone Name</label>
              <input type="text" data-state-key="zone_name" value={this.state.zone_name} onChange={this.changeValue} />
              <label>VAV Unit</label>
              <input type="text" data-state-key="zone_unit" value={this.state.zone_unit} onChange={this.changeValue} />
            </div>
          </Modal.Body>
          <button className="btn btn-default btn-custom btn-save" onClick={this.editZone}>Save</button>
        </Modal>
        <Modal show={this.state.showAddNewZoneModal} onHide={this.handleCloseC} dialogClassName="edit-zone-profile-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Add New Zone</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseC} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="zone-profile">
              <label>Zone Name</label>
              <input type="text" ref={zone_Name => this.zone_Name = zone_Name} />
              <label>VAV Unit</label>
              <input type="text" ref={zone_unit => this.zone_unit = zone_unit} />
            </div>
          </Modal.Body>
          <button className="btn btn-default btn-custom btn-save" onClick={this.addZone}>Add</button>
        </Modal>
        <Modal show={this.state.showEditLevelProfile} onHide={this.handleCloseD} dialogClassName="edit-zone-profile-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Edit Level</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseD} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="zone-profile">
              <label>Level Name</label>
              <input type="text" data-state-key="level_name" value={this.state.level_name} onChange={this.changeValue} />
            </div>
          </Modal.Body>
          <button className="btn btn-default btn-custom btn-save" onClick={this.editLevel}>Save</button>
        </Modal>
        <Footer {...this.props} />
      </div>
    );
  }
}