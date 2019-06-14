import React from 'react';
import { Dropdown, MenuItem, Modal } from 'react-bootstrap';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import SettingControl from 'components/SettingControl';
import config from 'config';

export default class DeviceConfiguration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showEditNetworkConfiguration: false,
      optionIPMode: [{ dhcp: false, static: false }],
      bacnetIface: '',
      bacnetDeviceId: '',
      bacnetPort: ''
    }
  }

  componentDidMount() {
    this.getDevicesSettingList();
  }

  handleCloseA = () => {
    this.setState({ showEditNetworkConfiguration: false });
  };

  handleShowA = (type) => {
    this.setState({ showEditNetworkConfiguration: true });
  };

  toggleOption = (parent, key) => {
    if (parent) {
      let name = 'option' + parent;
      let option = this.state[name];
      let status = option[0][key];
      option[0][key] = !status;
      this.setState({ [name]: option });
    } else {
      let name = 'option' + key;
      let status = this.state[name];
      this.setState({ [name]: !status });
    }
  }

  changeValue = (e) => {
    let name = e.target.getAttribute('data-state-key');
    this.setState({ [name]: e.target.value });
  }

  getDevicesSettingList = () => {
    const requestUrl = config.serverUrl + config.api.settings + '/devices';
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
        if (status == 200) {
          this.setState({ 
            devicesSettingList: res,
            bacnetIface: res.BacnetIface,
            bacnetDeviceId: res.BacnetDeviceId,
            bacnetPort: res.BacnetPort,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  saveDevicesSettingList = () => {
    const requestUrl = config.serverUrl + config.api.settings + '/devices';
    let data = {
      BacnetDeviceId: this.state.bacnetDeviceId,
      BacnetIface: this.state.bacnetIface,
      BacnetPort: this.state.bacnetPort
    };
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if(status == 200) {
          this.setState({ 
            devicesSettingList: res,
            bacnetIface: res.BacnetIface,
            bacnetDeviceId: res.BacnetDeviceId,
            bacnetPort: res.BacnetPort,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    return (
      <div className="device-configuration">
        <Navigation {...this.props} />
        <SettingControl {...this.props} />
        <div className="dc-detail container">
          <div className="dcd-pseudo">
            <div className="row">
              <div className="col-md-6">
                <h4>Network Configuration</h4>
                <div className="network-configuration">
                  <div className="tabs">
                    <span className="tab-item active">LAN</span>
                    <span className="tab-item">System</span>
                  </div>
                  <div className="content">
                    <div className="device-status">
                      <div className="row">
                        <div className="col-xs-6">
                          <div className="ds-label">
                            <img src="./wifi-modem-ico.svg" alt="wifi modem icon" />
                            <span>Device Status</span>
                          </div>
                        </div>
                        <div className="col-xs-6">
                          <div className="ds-value">
                            <i className="fa fa-circle"></i>
                            <span className="ds-value">Online</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ip-configuration">
                      <div className="row">
                        <div className="col-sm-6">
                          <div className="ip-address">
                            <label>IP Address</label>
                            <span>172.31.1.169</span>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="ip-address">
                            <label>Netmask</label>
                            <span>255.255.255.0</span>
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="ip-address">
                            <label>Gateway</label>
                            <span>172.31.1.20</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-default btn-custom btn-edit-profile" onClick={this.handleShowA}>
                      <span>Edit zone profile</span><img src="./white-edit-ico.svg" alt="edit zone profile" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <h4>System Configuration</h4>
                <div className="system-configuration">
                  <div className="actions">
                    <div className="timezone">
                      <div className="row">
                        <div className="col-sm-7">
                          <label>Set System Timezone</label>
                          <div className="timezone-dropdown">
                            <Dropdown id="timezone-dropdown">
                              <Dropdown.Toggle noCaret>
                                <table>
                                  <tbody>
                                    <tr>
                                      <td><span className="level">Australia / Sydney</span></td>
                                      <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </Dropdown.Toggle>
                              <Dropdown.Menu className="super-colors">
                                <MenuItem eventKey={{ name: 'Australia / Sydney', id: '1' }} onSelect={this.selectRole}>Australia / Sydney</MenuItem>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                        </div>
                        <div className="col-sm-5 action">
                          <button className="btn btn-default btn-custom btn-save-timezone" onClick={this.saveDevicesSettingList}>Save</button>
                        </div>
                      </div>
                    </div>
                    <div className="sync-with-server">
                      <div className="row">
                        <div className="col-sm-7">
                          <label>Sync with NTP Server</label>
                          <input type="text" placeholder="Some description" />
                        </div>
                        <div className="col-sm-5 action">
                          <button className="btn btn-default btn-custom btn-sync">Sync</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content">
                    <div className="row">
                      <div className="col-sm-4">
                        <label>BACnet Interface</label>
                        <input data-state-key="bacnetIface" value={this.state.bacnetIface} onChange={this.changeValue} />
                      </div>
                      <div className="col-sm-4">
                        <label>BACnet Device ID</label>
                        <input data-state-key="bacnetDeviceId" value={this.state.bacnetDeviceId} onChange={this.changeValue} />
                      </div>
                      <div className="col-sm-4">
                        <label>BACnet Port</label>
                        <input data-state-key="bacnetPort" value={this.state.bacnetPort} onChange={this.changeValue} />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-sm-12">
                        <label>Noify Email</label>
                        <span>armando.bauch@yahoo.com</span>
                      </div>
                    </div>
                    <div className="row text-center">
                      <button className="btn btn-default btn-custom btn-view-logs">View logs</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal show={this.state.showEditNetworkConfiguration} onHide={this.handleCloseA} dialogClassName="edit-network-configuration-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Edit Network Configuration</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseA} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="network-configuration-detail">
              <div className="mode">
                <div className="row">
                  <div className="col-sm-6">
                    <div className="mode-item">
                      <span>DHCP</span>
                      <div className={this.state.optionIPMode[0]['dhcp'] ? 'check-item active' : 'check-item'}>
                        <div className="pseudo" onClick={this.toggleOption.bind(this, 'IPMode', 'dhcp')}>
                          <img src="./checked-ico.svg" alt="check box" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="mode-item">
                      <span>Static</span>
                      <div className={this.state.optionIPMode[0]['static'] ? 'check-item active' : 'check-item'}>
                        <div className="pseudo" onClick={this.toggleOption.bind(this, 'IPMode', 'static')}>
                          <img src="./checked-ico.svg" alt="check box" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ip-address">
                <label>IP Address</label>
                <div className="row">
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="172" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="31" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="1" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="169" />
                  </div>
                </div>
              </div>
              <div className="netmask">
                <label>Netmask</label>
                <div className="row">
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="255" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="255" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="255" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="0" />
                  </div>
                </div>
              </div>
              <div className="gateway">
                <label>Gateway</label>
                <div className="row">
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="172" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="31" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="1" />
                  </div>
                  <div className="col-xs-6 col-sm-3">
                    <input type="text" defaultValue="20" />
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <button className="btn btn-default btn-custom btn-add-network-configuration">Add</button>
        </Modal>
        <Footer {...this.props} />
      </div>
    );
  }
}