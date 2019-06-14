import React from 'react';
import config from 'config';
import Navigation from 'components/Navigation';
import SettingControl from 'components/SettingControl';
import Footer from 'components/Footer';

export default class BACnet extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      bacnet: {},
      devicesList: [],
      currentDevice: 0,
      loggedObjects: {},
      lowInstance: '0',
      highInstance: '0'
    };
  }
  
  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if(key) {
      this.setState({ [key]: target.value });
    }
  }
  
  componentDidMount(){
    this.getDatacollectorStatus();
    this.getBACnetList();
  }
  
  toggleDevice = (id) => {
    let temp = this.state.currentDevice;
    if(temp == id){
      this.setState({currentDevice: 0});
    }
    else {
      this.setState({currentDevice: id});
    }
  }
  
  checkObject = (obj) => {
    let name = obj.name + '-' + obj.device_id;
    let temp = this.state.loggedObjects;
    if(temp[name]){
      temp[name] = !temp[name];
    }
    else{
      temp[name] = true;
    }
    this.setState({loggedObjects: temp});
  }
  
  objectsList = (objects) => {
    let views = []
    objects.forEach((object, index) => {
      let name = object.name + '-' + object.device_id;
      let obj = (
        <tr key={object.name} className="object-item">
          <td>
            <div className={this.state.loggedObjects[name] && this.state.loggedObjects[name] == true ? 'check-item active' : 'check-item'} onClick={e => {
              e.preventDefault();
              this.checkObject(object);
            }}>
              <img src="./checked-ico.svg" alt="check icon"/>
            </div>
          </td>
          <td>{object.name}</td>
          <td>{object.type_text != 'UNKNOWN_OBJECT' ? object.type_text : object.type_text + '( type: ' + object.type + ')'}</td>
          <td>{object.value != 'unknown-property' ? object.value : ''}</td>
          <td>{object.units != -1 ? object.units : ''}</td>
          <td>
            <div className="delete-wrapper">
              <img src="./circle-trash-ico.svg" className="btn-delete" alt="delete-ico" onClick={e => {
                e.preventDefault();
                if(confirm('Delete object: ' + name + ' ?')){
                  let data = {
                    device_id: object.device_id,
                    object_id: object.id,
                    object_type: object.type
                  };
                  this.deleteObject(data);
                }
              }}/>
            </div>
          </td>
        </tr>
      );
      views.push(obj)
    })
    return views;
  }
  
  devicesList = () => {
    if(this.state.devicesList){
      let views = [];
      this.state.devicesList.forEach((device, index) => {
        let dv = (
          <div key={device.id} className="device-item row" onClick={e => {
            e.preventDefault();
            this.toggleDevice(device.id);
          }}>
            <div className="icon"><img src={this.state.currentDevice == device.id ? './arrow-ico-drop-up.png' : './arrow-ico.png'} alt=""/></div>
            <div className="name">{device.name}</div>
            <div className="status"><img src={device.status ? 'on-status.png' : 'off-status.png'} alt="status-icon"/></div>
            <div className="device">{device.id}</div>
            <div className="ip">{device.address}</div>
            <div className="vendor">{device.vendorname}</div>
            <div className="md">{device.modelname}</div>
            <div className="action">
              <button type="button" className="btn btn-default btn-custom btn-delete" onClick={e => {
                e.stopPropagation();
                if(confirm('Delete device: ' + device.name + ' ?')){
                  this.deleteBACnetDevice(device.id);
                }
              }}>Delete</button>
              <button type="button" className="btn btn-default btn-custom btn-scan" onClick={e => {
                e.stopPropagation();
                this.scanBACnetDevice(device.id);
              }}>Scan</button>
            </div>
          </div>
        );
        views.push(dv);
       
        let obj_list = (
          <table hidden={this.state.currentDevice != device.id} key={'object' + device.id} className="object-list">
            <thead>
              <tr className="header">
                <th className="header-title">Logging</th>
                <th className="header-title">Point Name</th>
                <th className="header-title">Type</th>
                <th className="header-title">Current Value</th>
                <th className="header-title">Units</th>
                <th className="header-title">Action</th>
              </tr>
            </thead>
            <tbody>
              {device.objects.length > 0 ? this.objectsList(device.objects) : (
                <tr className="empty">
                  <td></td>
                  <td></td>
                  <td>No data available in table</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        );
        views.push(obj_list);
      })
      return views;
    }
  }
  
  getBACnetList = () => {
    const requestUrl = config.serverUrl + config.api.bacnets + 'list';
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
        if(Object.keys(res).length > 0){
          this.setState({
            bacnet: res,
            devicesList: res.devices,
            lowInstance: res.lowinstance,
            highInstance: res.highinstance
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getDatacollectorStatus = () => {
    const requestUrl = config.serverUrl + config.api.datacollector + 'status';
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
        this.setState({ datacollectorStatus: res.run });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  deleteBACnetDevice = (id) => {
    const requestUrl = config.serverUrl + config.api.bacnets + 'devices/' + id + '/delete';
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then(response => {
        status = response.status;
        if(status != 204){
          return response.json();
        }
      })
      .then((res) => {
        if(status == 204){
          this.getBACnetList();
        }
        else{
          alert(res.errors);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  scanBACnetDevice = (id) => {
    const requestUrl = config.serverUrl + config.api.bacnets + 'devices/' + id + '/scan';
    let status = 0;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json",
      },
    })
      .then(response => {
        status = response.status;
        if(status != 204){
          return response.json();
        }
      })
      .then((res) => {
        if(status != 204){
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for( let key in res.errors){
            let string = key + ': ' + res.errors[key];
            array.push(string);
            count++;
            if(count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else{
          alert('BACnet scan device sent');
          this.componentDidMount();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  deleteObject = (data) => {
    const requestUrl = config.serverUrl + config.api.bacnets + 'objects';
    let status;
    let cache = [];
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
      body: JSON.stringify(data, function(key, value) {
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
        if(status != 204){
          return response.json();
        }
      })
      .then((res) => {
        if(status == 204){
          this.getBACnetList();
        }
        else{
          alert(res.errors);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  updateMinMax = () => {
    const requestUrl = config.serverUrl + config.api.settings + '/devices';
    let data = {
      BacnetMinDevId: this.state.lowInstance ,
      BacnetMaxDevId: this.state.highInstance
    };
    let cache =[];
    let status = null;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data, function(key, value) {
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
        if(status != 200){
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for( let key in res.errors){
            let string = key + ': ' + res.errors[key];
            array.push(string);
            count++;
            if(count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else {
          this.componentDidMount();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  startDataCollector = () => {
    const requestUrl = config.serverUrl + config.api.datacollector + 'start';
    fetch(requestUrl, {
      method: 'POST',
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
        this.setState({ datacollectorStatus: res.run });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  stopDataCollector = () => {
    const requestUrl = config.serverUrl + config.api.datacollector + 'stop';
    fetch(requestUrl, {
      method: 'POST',
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
        console.log(res);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  scanAllDevices = () => {
    const requestUrl = config.serverUrl + config.api.bacnets + 'sendwhois';
    let status = 0;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
        "Content-Type": "application/json",
      },
    })
      .then(response => {
        status = response.status;
        if(status != 204){
          return response.json();
        }
      })
      .then((res) => {
        if(status != 204){
          let length = Object.keys(res.errors).length;
          let array = new Array();
          let count = 0;
          for( let key in res.errors){
            let string = key + ': ' + res.errors[key];
            array.push(string);
            count++;
            if(count == length) {
              const f = array.join('\n');
              alert(f);
            }
          }
        }
        else{
          this.componentDidMount();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  inputBlur = () => {
    this.updateMinMax();
  }
  
  render(){
    return(
      <div className="bacnet">
        <Navigation {...this.props} />
        <SettingControl {...this.props} />
        <div className="bacnet-details container">
          <div className="bacnet-pseudo">
            <div className="bacnet-status">
              <div className="datacollector">
                <div className="status">
                  <label>Datacollector: </label>
                  <span className={(this.state.datacollectorStatus && this.state.datacollectorStatus == true ) ? 'running' : 'stopped'}>{(this.state.datacollectorStatus && this.state.datacollectorStatus == true) ? 'running' : 'stopped'}</span>
                </div>
                <button className="btn btn-default btn-custom" onClick={e => { 
                  if(this.state.datacollectorStatus == true) {
                    this.stopDataCollector();
                  }
                  else {
                    this.startDataCollector();
                  }
                  }}>{(this.state.datacollectorStatus && this.state.datacollectorStatus == true) ? 'Stop' : 'Start'}
                </button>
              </div>
              <div className="scan">
                <button className="btn btn-default btn-custom" onClick={this.scanAllDevices}>Scan</button>
              </div>
              <div className="device-status">
                <span>Low device instance</span>
                <input data-state-key="lowInstance" value={this.state.lowInstance} onChange={this.changeValue} onBlur={this.inputBlur}/>
              </div>
              <div className="device-status">
                <span>High device instance</span>
                <input data-state-key="highInstance" value={this.state.highInstance} onChange={this.changeValue} onBlur={this.inputBlur}/>
              </div>
            </div>
            <div className="device-list">
              <div className="header">
                <div className="icon"></div>
                <div className="header-title device-name">Device name</div>
                <div className="header-title status">Status</div>
                <div className="header-title device">Device ID</div>
                <div className="header-title ip">IP Address</div>
                <div className="header-title vendor">Vendor</div>
                <div className="header-title md">Model</div>
                <div className="header-title action">Action</div>
              </div>
              <div className="device-wrapper">
                {this.devicesList()}
              </div>
            </div>
          </div>
        </div>
        <Footer {...this.props} />
      </div>
    )
  }
}