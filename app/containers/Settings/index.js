import React from 'react';
import config from 'config';
import { Dropdown, MenuItem, Modal } from 'react-bootstrap';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import SettingControl from 'components/SettingControl';
import uuidv1 from 'uuid';
import isURL from 'validator/lib/isURL';
import orderBy from 'lodash/orderBy';
import some from 'lodash/some';
import Spin from 'antd/lib/spin';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDeletedTenant: false,
      showDeletedUser: false,
      showAddTenantModal: false,
      showAddUserTenantModal: false,
      showUserTenantListModal: false,
      showTenantProfileModal: false,
      showEditUserTenantModal: false,
      optionA: false,
      optionB: false,
      selectedLevel: '8',
      companiesList: [],
      levelsList: [],
      companyUserList: [],
      selectedTime: '15',
      selectedRole: 'CLIENT',
      selectedRole_User: 'User',
      selectedCompany_Name: '',
      selectedCompany_Id: 0,
      selectedCompany_Address: '',
      currentUsername: '',
      currentCompany: [],
      currentPermission: {},
      currentUserPermission: {},
      newPermission: [],
      setPW: false,
      currentPermission_Id: 0,
      currentZonesList: {},
      settingList: {},
      currentCompany_Id: 0,
      file: '',
      imagePreviewUrl: '',
      uploaded: false,
      currentEditUser: {},
      userPermissions: [],
      ablePermissions: [],
      selectedAblePermission: []
    }
  }

  createSelectedData = () => {
    const { userPermissions, ablePermissions } = this.state;

    const currentPermission = id => userPermissions.filter(i => i.id == id);
    const isChecked = (zone, id) => {
      const CP = currentPermission(id)
      return CP && CP.length ? (CP[0].zones.filter(z => z.name == zone.name).length ? true : false) : false
    }

    let newLevels = [];
    if (ablePermissions.levels && ablePermissions.levels.length) {
      newLevels = ablePermissions.levels.map(level => ({
        ...level,
        zones: level.zones.map(zone => ({
          ...zone,
          checked: isChecked(zone, level.id)
        })
        )
      })
      )
    }

    const newSelectedAblePermission = {
      ...ablePermissions,
      levels: newLevels,
    }
    if (newSelectedAblePermission.length != 0) {
      this.setState({
        selectedAblePermission: newSelectedAblePermission
      })
    }

  }

  currentUserPermissions = () => {
    const { selectedAblePermission } = this.state;
    return (
      selectedAblePermission.levels ? selectedAblePermission.levels.map(permission => (
        <div className="row" key={permission.id}>
          <table>
            <tbody>
              <tr>
                <td width="12%" className="text-up"><label>Level:</label></td>
                <td width="25%">
                  <div className="permission-dropdown">
                    <span> {permission.name} </span>
                  </div>
                </td>
                <td width="10%"></td>
                <td width="12%" className="text-up"><label>Zone:</label></td>
                <td width="25%">
                  <div className="permission-dropdown">
                    {this.DropdownZonePermissions(permission)}
                  </div>
                </td>
                <td width="10%"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )
      ) : null
    )
  }

  handleCheck = (e, permId, all = false) => {
    const { selectedAblePermission } = this.state;
    const getIndexById = id => selectedAblePermission.levels.findIndex(i => i.id == id)
    const lev = selectedAblePermission.levels;
    let newSelectedAblePermission = {};
    if (!all) {
      lev[getIndexById(permId)] = {
        ...lev[getIndexById(permId)],
        zones: [
          ...lev[getIndexById(permId)].zones.map(z => z.id == e.id ? { ...z, checked: !z.checked } : z),
        ]
      }
      newSelectedAblePermission = {
        ...selectedAblePermission,
        levels: lev
      }
    } else {
      lev[getIndexById(permId)] = {
        ...lev[getIndexById(permId)],
        zones: lev[getIndexById(permId)].zones.filter(z => z.checked).length > 1 ? lev[getIndexById(permId)].zones.map(z => ({ ...z, checked: false })) : lev[getIndexById(permId)].zones.map(z => ({ ...z, checked: true }))
      }
      newSelectedAblePermission = {
        ...selectedAblePermission,
        levels: lev
      }
    }
    this.setState({ selectedAblePermission: newSelectedAblePermission })
  }

  DropdownZonePermissions = (permission) => {
    const isChecked = (zone) => zone.checked;
    const checkedName = (perm) => {
      const check = perm.zones.filter((z) => z.checked);
      const total = perm.zones.length;
      if (check.length === 0) {
        return 'None';
      } else if (check.length > 1 && check.length < total) {
        return 'Multiple';
      }
      return perm.zones.filter((z) => z.checked).length === perm.zones.length ? 'All' : perm.zones.filter((z) => z.checked)[0].name;
    };

    return (
      <Dropdown id="permission-dropdown-2" >
        <Dropdown.Toggle noCaret>
          <table>
            <tbody>
              <tr>
                <td><span className="level"> {checkedName(permission)} </span></td>
                <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
              </tr>
            </tbody>
          </table>
        </Dropdown.Toggle>
        <Dropdown.Menu className="super-colors">
          {
            permission.zones.length > 1 ?
              <MenuItem key={uuidv1()} eventKey={{ name: 'all' }} onSelect={e => this.handleCheck(e, permission.id, true)}>Select all</MenuItem>
              : null
          }
          {permission.zones.map(zone => (
            <MenuItem key={uuidv1()} eventKey={{ parent: 'zone_dropdown', id: zone.id, name: zone.name }} onSelect={e => this.handleCheck(e, permission.id)}>
              <input type="checkbox" checked={isChecked(zone)} /> {zone.name}
            </MenuItem>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  prepareData = () => {
    const { userPermissions, currentUserPermission, selectedAblePermission } = this.state;

    const changeTenant = [],
      addTenant = [],
      delTenant = [],
      keys = Object.keys(currentUserPermission);

    const pushChange = ob => changeTenant.push(ob);
    const pushAdd = ob => addTenant.push(ob);
    const pushDel = ob => delTenant.push(ob);

    const getPermissionID = (levelId, zoneId) =>
      keys.find(key => currentUserPermission[key].level.id == levelId && currentUserPermission[key].zone.id == zoneId);

    const existsInUserPermissions = (levelId, zoneId) => {
      const permLevel = userPermissions.find(i => i.id == levelId);
      if (!permLevel) {
        return false;
      } else {
        return some(permLevel.zones, ['id', zoneId]);
      }
    }

    selectedAblePermission.levels.forEach(level => {
      level.zones.forEach(zone => {
        if (zone.checked) {
          if (existsInUserPermissions(level.id, zone.id)) {
            pushChange({
              permission: getPermissionID(level.id, zone.id),
              level_id: level.id,
              zone_id: zone.id
            })
          } else {
            pushAdd({
              permission: getPermissionID(level.id, zone.id),
              level_id: level.id,
              zone_id: zone.id
            })
          }
        } else {
          pushDel({
            permission: getPermissionID(level.id, zone.id),
          })
        }
      })
    })
    return { changeTenant, addTenant, delTenant }
  }

  handleImageChange = (e) => {
    let file = e.target.files[0];
    let reader = new FileReader();

    reader.onloadend = () => {
      this.setState({
        file: file,
        imagePreviewUrl: reader.result,
      });
    };

    reader.readAsDataURL(file);
  }

  handleCloseA = () => {
    this.setState({
      showAddTenantModal: false,
      setPW: false
    });
  };

  handleShowA = (type) => {
    this.setState({
      showAddTenantModal: true,
      optionA: true,
    });
  };

  handleCloseB = () => {
    this.setState({
      showAddUserTenantModal: false,
      setPW: false
    });
  };

  handleShowB = (type) => {
    this.setState({ showAddUserTenantModal: true });
  };

  handleCloseC = () => {
    this.setState({
      showUserTenantListModal: false,
      showDeletedUser: false,
    });
  };

  handleShowC = (id) => {
    this.setState({
      showUserTenantListModal: true,
      currentCompany_Id: id
    });
    this.getUserList(id);
  };

  handleShowD = (company) => {
    this.setState({
      showTenantProfileModal: true,
      currentCompany: company,
      currentUsername: company.username,
      selectedAddress: company.address,
      selectedRole: company.role,
      optionA: company.useglobal,
      imagePreviewUrl: company.logo,
      newPermission: [],
    }, () => {
      this.getPermission('Tenant');
    });
  }

  handleCloseD = () => {
    this.setState({
      showTenantProfileModal: false,
      imagePreviewUrl: '',
      file: '',
      currentCompany: [],
      currentPermission: [],
      uploaded: false
    });
  }

  handleShowE = () => {
    let role = '';
    if (this.state.currentEditUser.role == 'ROLE_USER') role = 'User';
    else role = 'Tenant Admin';
    this.setState({
      showEditUserTenantModal: true,
      selectedRole_User: role,
      newPermission: [],
      currentUsername: this.state.currentEditUser.username,
    });
  }

  handleCloseE = () => {
    this.setState({
      showEditUserTenantModal: false,
      currentUserPermission: [],
      userPermissions: [],
    });
  }
  toggleOption = (key) => {
    let status = this.state[key];
    this.setState({ [key]: !status });
  };

  selectLevel = (name) => {
    if (name) {
      this.setState({ selectedLevel: name });
    }
  }

  select = (eventKey) => {
    if (eventKey.parent == 'role dropdown') {
      this.setState({ selectedRole_User: eventKey.name });
    }
    else if (eventKey.parent == 'time dropdown') {
      this.setState({ selectedTime: eventKey.id });
    }
    else if (eventKey.parent == 'address dropdown') {
      this.setState({ selectedAddress: eventKey.name });
    }
  }

  user_select = (eventKey) => {
    if (eventKey.parent == 'role dropdown') {
      this.setState({ selectedRole_User: eventKey.name });
    }
    else if (eventKey.parent == 'company dropdown') {
      this.setState({
        selectedCompany_Name: eventKey.name,
        selectedCompany_Id: eventKey.id,
        selectedCompany_Address: eventKey.address
      });
    }
  }

  componentDidMount() {
    this.getTenantList();
    const requestUrl_2 = config.serverUrl + config.api.zonemapping_levels;
    fetch(requestUrl_2, {
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
            selectedLevel: res[0].name,
          });
          res.forEach((level, index) => {
            this.getListZones(level.id);
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
    const requestUrl = config.serverUrl + config.api.settings;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (Object.keys(res).length) {
          this.setState({
            settingList: res,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
    this.createSelectedData();
  }

  getTenantList = () => {
    const params = {
      include_deleted: this.state.showDeletedTenant,
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
        if (Array.isArray(res) && res.length > 0) {
          this.setState({ companiesList: res });
          this.setState({
            selectedCompany_Name: res[0].title,
            selectedCompany_Id: res[0].id,
            selectedCompany_Address: res[0].address,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  upload = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    let requestUrl = config.serverUrl + config.api.companies_action + id + '/upload_logo';
    let status;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "Authorization": sessionStorage.getItem('token'),
      },
      body: formData,
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
          const item = this.state.currentPermission;
          for (let key in item) {
            let permission_id = key;
            let level_id = item[key].level.id;
            let zone_id = item[key].zone.id;
            this.updateTenantPermission(permission_id, level_id, zone_id);
          }
          if (this.state.newPermission != []) {
            this.state.newPermission.forEach((permission, index) => {
              this.addPermission(permission.level.id, permission.zone.id);
            });
            this.setState({ newPermission: [] });
          }
          this.handleCloseD();
          this.componentDidMount();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  addNewTenant = () => {
    if (this.state.setPW == true) {
      if (this.tenant_Firstname.value.length > 0 && this.tenant_Lastname.value.length > 0 && this.tenant_Username.value.length > 0 && this.tenant_Email.value.length > 0 && this.tenant_Title.value.length > 0 && this.tenant_price.value.length > 0 && this.tenant_Password.value.length > 0 && this.tenant_Password_confirm.value.length > 0 && this.tenant_Password.value == this.tenant_Password_confirm.value && this.tenant_Address.value.length > 0) {
        const requestUrl = config.serverUrl + config.api.companies_list;
        let ug = 0;
        let int = 0;
        let pr = 0;
        if (this.state.optionA == true) {
          ug = 1;
          int = 0;
          pr = 0;
        }
        else {
          ug = 0;
          int = this.state.selectedTime;
          pr = this.tenant_price.value;
        }
        let status;
        let cache = [];
        let data = {
          title: this.tenant_Title.value,
          price: pr,
          interval: int,
          useglobal: ug,
          username: this.tenant_Username.value,
          email: this.tenant_Email.value,
          firstname: this.tenant_Firstname.value,
          lastname: this.tenant_Lastname.value,
          address: this.tenant_Address.value,
          note: "",
          password: this.tenant_Password.value
        };
        fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "accept": "application/json",
            "Authorization": sessionStorage.getItem('token')
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
          .then((response) => {
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
      else if (this.tenant_Password.value !== this.tenant_Password_confirm.value) {
        alert('Password must be match');
      }
      else {
        alert('Please enter all required fields');
      }
    }
    else {
      alert('Password must be set');
    }
  }

  deleteTenant = (id) => {
    const params = {
      id: id,
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.companies_action + query;
    let status;
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
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
          this.componentDidMount();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  addNewUser = () => {
    if (this.state.setPW == true) {
      if (this.user_Firstname.value.length > 0 && this.user_Lastname.value.length > 0 && this.user_Email.value.length > 0 && this.tenant_Password.value.length > 0 && this.tenant_Password_confirm.value.length > 0 && this.tenant_Password.value == this.tenant_Password_confirm.value) {
        const params = {
          id: this.state.selectedCompany_Id,
        };
        const esc = encodeURIComponent;
        const query = Object.keys(params)
          .map(k => esc(params[k]))
          .join('&');
        const requestUrl = config.serverUrl + config.api.companies_action + query + '/users';
        let status;
        let cache = [];
        let data = {
          username: this.user_Username.value,
          email: this.user_Email.value,
          firstname: this.user_Firstname.value,
          lastname: this.user_Lastname.value,
          address: this.state.selectedCompany_Address,
          note: "string",
          password: this.tenant_Password.value
        };
        fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "accept": "application/json",
            "Authorization": sessionStorage.getItem('token')
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
          .then((response) => {
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
              let role = '';
              if (this.state.selectedRole_User == 'User') role = 'USER';
              else if (this.state.selectedRole_User == 'Tenant Admin') role = 'CLIENT';
              this.setTenantRole(this.user_Username.value, role);
              this.componentDidMount();
              this.handleCloseB();
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }
      else if (this.tenant_Password.value !== this.tenant_Password_confirm.value) {
        alert('Password must be match');
      }
      else {
        alert('Please enter all required fields');
      }
    }
    else {
      alert('Password must be set');
    }
  }

  deleteUser = (id) => {
    const params = {
      username: id,
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.users + '/' + query;
    let status;
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
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
          this.getUserList(this.state.currentCompany_Id);
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
      include_deleted: this.state.showDeletedUser,
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
          this.setState({ companyUserList: res });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getPermission = (type) => {
    let params;
    if (type == 'User') {
      params = {
        username: this.state.currentEditUser.username,
      };
      this.setState({
        userPermissions: [],
        selectedAblePermission: []
      });
    }
    else {
      params = {
        username: this.state.currentUsername,
      };
    }
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
          res.levels.forEach((item, index) => {
            let count = 0;
            for (let id in item.zones) {
              let levelName = item.zones[id].permission_id;
              let data = {
                level: { id: item.id, name: item.name },
                zone: {
                  id: item.zones[id].id,
                  name: item.zones[id].name
                }
              }
              obj[levelName] = data;
              if (index == res.levels.length - 1 && count == item.zones.length - 1) {
                if (type == 'User') {
                  this.setState({
                    userPermissions: res.levels,
                    currentUserPermission: obj,
                  });
                  this.createSelectedData();
                }
                else {
                  this.setState({ currentPermission: obj });
                }
              }
              count++;
            }
          })
        }
        else {
          if (type == 'User') {
            this.setState({
              userPermissions: [],
              currentUserPermission: {},
            });
          }
          else {
            this.setState({ currentPermission: {} });
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getPermission_2 = (user) => {
    this.setState({
      ablePermissions: []
    });

    let params = {
      username: user,
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
          this.setState({
            ablePermissions: res,
          });
        }
        else {
          this.setState({
            ablePermissions: [],
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  getListZones = (level_id) => {
    const params = {
      id: level_id,
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
          let obj = this.state.currentZonesList;
          obj[level_id] = res;
          this.setState({ currentZonesList: obj });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  addNewPermission = () => {
    if (!this.state.levelsList[0] || !this.state.newPermission) {
      alert('Not ready!');
    }

    let newPermission = this.state.newPermission;
    let permission = {
      level: {
        id: this.state.levelsList[0].id,
        name: this.state.levelsList[0].name
      },
      zone: this.state.levelsList[0].zones[0]
    };

    newPermission.push(permission);
    this.setState({ newPermission: newPermission });
  }

  addNewPermission_User = () => {
    if (Object.keys(this.state.ablePermissions).length > 0) {
      let temp = this.state.ablePermissions.levels;
      let newPermission = this.state.newPermission;
      let permission = {
        level: {
          id: temp[0].id,
          name: temp[0].name
        },
        zone: temp[0].zones[0]
      };
      newPermission.push(permission);
      this.setState({ newPermission: newPermission });
    }
    else {
      alert('Your company still do not have any permission in this building');
    }
  }

  updateTenantProfile = () => {
    if (this.tenant_Firstname.value.length > 0 && this.tenant_Lastname.value.length > 0 && this.tenant_Username.value.length > 0 && this.tenant_Email.value.length > 0 && this.tenant_Title.value.length > 0 && this.tenant_price.value.length > 0 && this.tenant_Address.value.length > 0) {
      const params = {
        id: this.state.currentCompany.id,
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      const requestUrl = config.serverUrl + config.api.companies_action + query;
      let ug = 0;
      let int = 0;
      let pr = 0;
      if (this.state.optionA == true) {
        ug = true;
        int = 0;
        pr = 0;
      }
      else {
        ug = false;
        int = this.state.selectedTime;
        pr = this.tenant_price.value;
      }
      let status;
      let cache = [];
      let data = {
        title: this.tenant_Title.value,
        price: pr,
        interval: int,
        useglobal: ug,
        username: this.tenant_Username.value,
        email: this.tenant_Email.value,
        firstname: this.tenant_Firstname.value,
        lastname: this.tenant_Lastname.value,
        address: this.tenant_Address.value,
        note: "",
      };
      fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token')
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
        .then((response) => {
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

            if (this.state.file != '') {
              this.upload(this.state.currentCompany.id, this.state.file);
            }
            else {
              if (this.state.currentPermission != {}) {
                const item = this.state.currentPermission;
                let i = 0;
                for (let key in item) {
                  let permission_id = key;
                  let level_id = item[key].level.id;
                  let zone_id = item[key].zone.id;
                  this.updateTenantPermission(permission_id, level_id, zone_id);
                  if (i < Object.keys(item).length - 1) {
                    i++;
                  }
                  else {
                    this.handleCloseD();
                    this.componentDidMount();
                  }
                }
              }
              if (this.state.newPermission != []) {
                let i = 0;
                this.state.newPermission.forEach((permission, index) => {
                  this.addPermission(permission.level.id, permission.zone.id);
                  if (i < this.state.newPermission.length - 1) {
                    i++;
                  }
                  else {
                    this.handleCloseD();
                    this.componentDidMount();
                  }
                });
              }
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    else {
      alert('Please enter all required fields');
    }

  }

  updateUserProfile = () => {
    if (this.user_Username.value.length > 0 && this.user_Firstname.value.length > 0 && this.user_Lastname.value.length > 0 && this.user_Email.value.length > 0) {
      const params = {
        username: this.state.currentEditUser.username,
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      const requestUrl = config.serverUrl + config.api.users + '/' + query;
      let status;
      let cache = [];
      let data = {
        username: this.user_Username.value,
        email: this.user_Email.value,
        firstname: this.user_Firstname.value,
        lastname: this.user_Lastname.value,
        address: this.state.currentEditUser.address,
        note: this.state.currentEditUser.note,
      };
      fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token')
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
        .then((response) => {
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
            this.sendDataTenantPermission()
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else {
      alert('Please enter all required fields');
    }
  }

  sendDataTenantPermission = () => {
    const data = this.prepareData();

    // if (data.changeTenant.length) {
    //   data.changeTenant.forEach(tenant => this.updateTenantPermission(tenant.permission, tenant.level_id, tenant.zone_id));
    // }
    if (data.addTenant.length) {
      data.addTenant.forEach(tenant => this.addPermission(tenant.level_id, tenant.zone_id));
    }
    if (data.delTenant.length) {
      data.delTenant.forEach(tenant => this.deletePermission(tenant.permission, 'none'));
    }

    this.handleCloseE();
    // this.componentDidMount();
  }


  addPermission = (lvl_id, z_id) => {
    const params = {
      username: this.state.currentUsername,
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.users + '/' + query + '/permissions';
    let status;
    let data = {
      level_id: lvl_id,
      zone_id: z_id
    };
    let cache = [];
    return query != 'undefined' ? fetch(requestUrl, {
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
          this.getPermission('Tenant');
        }
      })
      .catch((error) => {
        console.log(error);
      }) : null;
  }

  updateTenantPermission = (permission, level, zone) => {
    const params = {
      id: permission,
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.permissions + '/' + query;
    let status;
    let cache = [];
    let data = {
      level_id: level,
      zone_id: zone
    };
    return query != 'undefined' ? fetch(requestUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
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
      .then((response) => {
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
      })
      .catch((error) => {
        console.log(error);
      }) : null;
  }

  editPermission = (eventKey) => {
    console.log(eventKey);
    let id = eventKey.zone.permission_id;
    let obj = this.state.currentPermission;

    if (eventKey.parent == 'level_dropdown') {
      let zonesList = this.state.currentZonesList;
      let levelZone = zonesList ? zonesList[eventKey.id][0] : {};
      let temp = {
        id: levelZone.id,
        name: levelZone.name
      };
      obj[id].level.id = eventKey.id;
      obj[id].level.name = eventKey.name;
      obj[id].zone = temp;
      this.setState({ currentPermission: obj });
    }
    else if (eventKey.parent == 'zone_dropdown') {
      if (!eventKey.zone.checked) {
        this.addPermission(eventKey.level.id, eventKey.zone.id);
      } else {
        //obj = obj.filter(x => x.zone.id != eventKey.zone.id);
        this.deletePermission(id, 'Tenant');
      }
      //this.setState({currentPermission: obj});
    }
  }

  editUserPermission = (eventKey) => {
    let id = this.state.currentPermission_Id;
    let obj = this.state.currentUserPermission;

    if (eventKey.parent == 'level_dropdown') {
      let levelZone = this.state.userPermissions[eventKey.number].zones[0];
      let temp = {
        id: levelZone.id,
        name: levelZone.name
      };
      obj[id].level.id = eventKey.id;
      obj[id].level.name = eventKey.name;
      obj[id].zone = temp;
      this.setState({ currentUserPermission: obj });
    }
    else if (eventKey.parent == 'zone_dropdown') {
      obj[id].zone.id = eventKey.id;
      obj[id].zone.name = eventKey.name;
      this.setState({ currentUserPermission: obj });
    }
  }

  /*editNewUserPermission = (eventKey) => {
    let temp = this.state.newPermission;
    if(eventKey.parent == 'level_dropdown'){
      let obj = {
        id: eventKey.level.id,
        name: eventKey.level.name
      };
      temp[eventKey.id].level = obj;
      temp[eventKey.id].zone = this.state.currentZonesList[eventKey.level.id][0];
      this.setState({newPermission: temp});
    }
    else if(eventKey.parent == 'zone_dropdown'){
      temp[eventKey.id].zone = eventKey.zone;
      this.setState({newPermission: temp});
    }
  }*/

  editNewPermission = (eventKey) => {
    let temp = this.state.newPermission;
    if (eventKey.parent == 'level_dropdown') {
      let obj = {
        id: eventKey.level.id,
        name: eventKey.level.name
      };
      temp[eventKey.id].level = obj;
      temp[eventKey.id].zone = this.state.currentZonesList[eventKey.level.id][0];
      this.setState({ newPermission: temp });
    }
    else if (eventKey.parent == 'zone_dropdown') {
      //temp[eventKey.id].zone = eventKey.zone;
      //this.setState({newPermission: temp});
      if (!eventKey.zone.checked) {
        eventKey.permission.zones.forEach(x => {
          if (x.id != eventKey.zone.id && x.checked) {
            this.addPermission(eventKey.permission.level.id, x.id);
          }
        });
        this.addPermission(eventKey.permission.level.id, eventKey.zone.id);
        /*let permission = {
          level: {
            id: eventKey.level.id,
            name: eventKey.level.name
          },
          zone: eventKey.zone
        };    
        temp.push(permission);*/
        temp = [];
      } else {
        temp = temp.filter(x => x.zone.id != eventKey.zone.id);
      }
      this.setState({ newPermission: temp });
    }
  }

  selectAllZones = (eventKey) => {
    let obj = this.state.currentPermission;
    eventKey.zones.forEach(x => {
      let found = false;
      for (let key in obj) {
        if (obj[key].zone.id == x.id) {
          found = true;
          break;
        }
      }
      if (!found) {
        this.addPermission(eventKey.level.id, x.id);
        this.setState({ newPermission: [] });
      }
    })
  }

  editNewPermission_User = (eventKey) => {
    let temp = this.state.newPermission;
    if (eventKey.parent == 'level_dropdown') {
      let obj = {
        id: eventKey.level.id,
        name: eventKey.level.name
      };
      temp[eventKey.id].level = obj;
      temp[eventKey.id].zone = this.state.ablePermissions.levels[eventKey.number].zones[0];
      this.setState({ newPermission: temp });
    }
    else if (eventKey.parent == 'zone_dropdown') {
      temp[eventKey.id].zone = eventKey.zone;
      this.setState({ newPermission: temp });
    }
  }

  deletePermission_Tenant = (eventKey) => {
    eventKey.zones.forEach(x => {
      this.deletePermission(x.permission_id, 'Tenant');
    })
  }

  deletePermission = (id, type) => {
    const params = {
      id: id,
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.permissions + '/' + query;
    let status;
    return query != 'undefined' ? fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
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
          this.getPermission(type);
        }
      })
      .catch((error) => {
        console.log(error);
      }) : null;
  }

  deleteNewPermission = (id) => {
    let temp = this.state.newPermission;
    temp.splice(id, 1);
    this.setState({ newPermission: temp });
  }

  setTenantRole = (user, role) => {
    const params = {
      username: user,
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.users + '/' + query + '/role';
    let status;
    let cache = [];
    let data = {
      new_role: role
    };
    fetch(requestUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
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
      .then((response) => {
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
      })
      .catch((error) => {
        console.log(error);
      });
  }

  setTenantRole_Delete = (user, role) => {
    const params = {
      username: user,
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.users + '/' + query + '/role';
    let status;
    let cache = [];
    let data = {
      new_role: role
    };
    fetch(requestUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
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
      .then((response) => {
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
          this.deleteUser(user);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  restore = (item) => {
    const requestUrl = config.serverUrl + config.api.companies_action + item.id + '/restore';
    let status;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then((response) => {
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
          this.getTenantList();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  restoreUser = (user) => {
    const requestUrl = config.serverUrl + config.api.users + '/' + user.username + '/restore';
    let status;
    fetch(requestUrl, {
      method: 'POST',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then((response) => {
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
          this.getUserList(this.state.currentCompany_Id);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  toggleChange = (type) => {
    if (type == 'Tenant') {
      let status = this.state.showDeletedTenant;
      this.setState({
        showDeletedTenant: !status,
      }, () => {
        this.getTenantList();
      });
    }
    else if (type == 'User') {
      let status = this.state.showDeletedUser;
      this.setState({
        showDeletedUser: !status,
      }, () => {
        this.getUserList(this.state.currentCompany_Id);
      });
    }
  }

  checkZoneSelection = (zones) => {
    let zcount = zones.length;
    let zchecked = 0;
    zones.forEach(x => { if (x.checked) zchecked++ });
    if (zchecked == 1) return zones.find(x => x.checked).name;
    if (zchecked == zcount) return "All";
    if (zchecked > 0) return "Multiple"
    return "None";
  }

  render() {
    const setPW_Button = (
      <div className="set-password">
        <button className="btn btn-default btn-custom" onClick={e => {
          this.setState({ setPW: true });
        }}>
          <img src="./white-lock-ico.svg" alt="user icon" />
          <span>Set Password</span>
        </button>
      </div>
    );
    const setPW_Form = (
      <div className="row">
        <div className="col-sm-6">
          <div className="password">
            <label>Password</label>
            <input type="password" ref={(tenant_Password) => this.tenant_Password = tenant_Password} />
          </div>
        </div>
        <div className="col-sm-6">
          <div className="confirm-password">
            <label>Confirm Password</label>
            <input type="password" ref={(tenant_Password_confirm) => this.tenant_Password_confirm = tenant_Password_confirm} />
          </div>
        </div>
      </div>
    );

    const levelList = this.state.levelsList.map((item, index) => {
      return (
        <MenuItem key={index} eventKey={{ name: item.name, id: item.id, parent: 'level_dropdown' }} onSelect={this.editPermission}>{item.name}</MenuItem>
      );
    });

    let currentPermissions = new Array();
    const item = this.state.currentPermission;
    let zonesList = this.state.currentZonesList ? this.state.currentZonesList : {};
    let tenantPermissions = [];
    for (let key in item) {
      let lev = tenantPermissions.find(x => x.level.id == item[key].level.id);
      if (!lev) {
        lev = {
          level: item[key].level,
          zones: zonesList[item[key].level.id]
            // ? zonesList[item[key].level.id]
            ? orderBy(zonesList[item[key].level.id], [item => item.name.toLowerCase()], ['asc'])
            : [],
        };
        lev.zones.forEach(x => x.checked = false);
        tenantPermissions.push(lev);
      }
      let z = lev.zones.find(x => x.id == item[key].zone.id);
      if (z) {
        z.permission_id = key;
        z.checked = true;
      }
    };
    for (let key in tenantPermissions) {
      let level = tenantPermissions[key].level.id;
      let levelZones = zonesList[level] ? zonesList[level] : [];
      let permission = (
        <div key={key} className="row">
          <table>
            <tbody>
              <tr>
                <td width="12%" className="text-up"><label>Level:</label></td>
                <td width="25%">
                  <div className="permission-dropdown">
                    <Dropdown disabled={sessionStorage.getItem('role') != 'ROLE_ADMIN' || this.state.currentCompany.deleted_at != null} id="permission-dropdown-1" onClick={e => {
                      e.preventDefault();
                    }}>
                      <Dropdown.Toggle noCaret>
                        <table>
                          <tbody>
                            <tr>
                              <td><span className="level">{tenantPermissions[key].level.name}</span></td>
                              <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                            </tr>
                          </tbody>
                        </table>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="super-colors">
                        {levelList}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </td>
                <td width="10%"></td>
                <td width="12%" className="text-up"><label>Zone:</label></td>
                <td width="25%">
                  <div className="permission-dropdown">
                    <Dropdown disabled={sessionStorage.getItem('role') != 'ROLE_ADMIN' || this.state.currentCompany.deleted_at != null} id="permission-dropdown-2" onClick={e => {
                      e.preventDefault();
                    }}>
                      <Dropdown.Toggle noCaret>
                        <table>
                          <tbody>
                            <tr>
                              <td><span className="level">{this.checkZoneSelection(tenantPermissions[key].zones)}</span></td>
                              <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                            </tr>
                          </tbody>
                        </table>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="super-colors">
                        {
                          levelZones.length > 1 ?
                            <MenuItem key={uuidv1()} eventKey={tenantPermissions[key]} onSelect={this.selectAllZones}>Select all</MenuItem>
                            : null
                        }
                        {
                          tenantPermissions[key].zones.map((zone, index) => {
                            const isChecked = zone => zone.checked;
                            return (
                              //<MenuItem key={index} eventKey={{name: zone.name, id: zone.id, parent: 'zone_dropdown'}} onSelect={this.editPermission}>{zone.name}</MenuItem>                              
                              <MenuItem key={uuidv1()} eventKey={{ parent: 'zone_dropdown', zone: zone, level: tenantPermissions[key].level }} onSelect={this.editPermission}>
                                <input type="checkbox" checked={isChecked(zone)} /> {zone.name}
                              </MenuItem>
                            );
                          })
                        }
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </td>
                <td width="10%"></td>
                <td width="12%" className="text-up">
                  <img hidden={sessionStorage.getItem('role') != 'ROLE_ADMIN'} src="./circle-trash-ico.svg" className="btn-delete" alt="trash icon" onClick={e => {
                    e.preventDefault();
                    if (this.state.currentCompany.deleted_at != null) {
                      return;
                    }
                    else {
                      if (confirm('Delete permission for level: ' + tenantPermissions[key].level.name + ' all zones?')) {
                        this.deletePermission_Tenant(tenantPermissions[key]);
                      }
                    }
                  }} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
      currentPermissions.push(permission);
    }

    return (
      <div className="settings">
        <Navigation {...this.props} />
        <SettingControl {...this.props} />
        <div className="setting-detail container">
          <div className="sd-pseudo">
            <div className="row">
              <div className="col-xs-12 col-sm-6 col-md-4">
                <div className="locations-dropdown">
                  <Dropdown id="fl-locations-dropdown">
                    <Dropdown.Toggle noCaret>
                      <table>
                        <tbody>
                          <tr>
                            <td className="lc-image" rowSpan="2"><img src="./location-image.png" alt="avatar" /></td>
                            <td className="lc-name">{this.state.settingList.Building ? (this.state.settingList.Building.length <= 15 ? this.state.settingList.Building : this.state.settingList.Building.substring(0, 15) + '...') : ''}</td>
                            <td rowSpan="2"><span className="pull-right"><i className="fa fa-caret-down" aria-hidden="true"></i></span></td>
                          </tr>
                          <tr>
                            <td className="lc-address">{this.state.settingList.Address}, {this.state.settingList.Suburb} {this.state.settingList.City}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="super-colors">
                      <MenuItem eventKey="1">Street: {this.state.settingList.Address}</MenuItem>
                      <MenuItem eventKey="1">Suburb: {this.state.settingList.Suburb}</MenuItem>
                      <MenuItem eventKey="2">City: {this.state.settingList.City}</MenuItem>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
              <div className="col-xs-12 col-sm-6 col-md-8">
                <div className="buttons">
                  <div className="row">
                    <div hidden={sessionStorage.getItem('role') != 'ROLE_ADMIN'} className="col-sm-offset-4 col-sm-4 add-tenant">
                      <button type="button" className="btn btn-default btn-custom btn-add-tenant" onClick={this.handleShowA}>
                        <img src="./white-plus-ico.svg" alt="add tenant" />
                        <span>Add Tenant</span>
                      </button>
                    </div>
                    <div className="col-sm-4 add-user">
                      <button type="button" className="btn btn-default btn-custom btn-add-user" onClick={this.handleShowB}>
                        <img src="./add-user-ico.svg" alt="add user" />
                        <span>Add User</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <div hidden={sessionStorage.getItem('role') == 'ROLE_CLIENT'} className="level-list">
                  <ul>
                    <div className="check-btn">
                      <span>Show Deleted Tenants</span>
                      <div className={this.state.showDeletedTenant ? 'check-item active' : 'check-item'}>
                        <div className="pseudo" onClick={e => {
                          e.preventDefault();
                          this.toggleChange('Tenant');
                        }}>
                          <img src="./checked-ico.svg" alt="check box" />
                        </div>
                      </div>
                    </div>
                  </ul>
                </div>
              </div>
              <div className="col-md-8">
                <div className="tenant-list">
                  <div className="row">
                    {this.state.companiesList.map((item, index) => {
                      return (
                        <div key={index} className="col-md-6 tl-item">
                          <div className="pseudo">
                            <div className="tli-description" onClick={e => {
                              e.preventDefault();
                              this.handleShowD(item);
                            }}>
                              <table>
                                <tbody>
                                  <tr>
                                    <td width="25%">
                                      {item.logo ? <img src={item.logo + '?k=' + uuidv1()} alt="img" /> : <div className="default-logo"><span>{item.username.charAt(0)}</span></div>}
                                    </td>
                                    <td width="75%">
                                      <label>{item.title.length > 16 ? item.title.substring(0, 13) + '...' : item.title}</label>
                                      <span className="position">{item.firstname + ' ' + item.lastname}</span>
                                      <span className="deleted">{item.deleted_at != null ? '(Tenant deleted)' : ''}</span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="tli-action">
                              <table>
                                <tbody>
                                  <tr>
                                    <td width="50%">
                                      <div className="cursor-pointer tentant-user-list" onClick={e => {
                                        e.preventDefault();
                                        this.setState({ selectedCompany_Name: item.title }, () => {
                                          this.getPermission_2(item.username);
                                          this.handleShowC(item.id);
                                        })
                                      }}>
                                        <span>User List</span>
                                        <img src="./person-ico.svg" alt="tenant user" />
                                      </div>
                                    </td>
                                    <td width="50%">
                                      <div className="cursor-pointer remove-tenant" onClick={e => {
                                        if (sessionStorage.getItem('role') == 'ROLE_ADMIN') {
                                          e.preventDefault();
                                          if (item.deleted_at == null) {
                                            this.deleteTenant(item.id);
                                          }
                                          else {
                                            this.restore(item);
                                          }
                                        }
                                      }}>
                                        <span>{item.deleted_at == null ? 'Remove Tenant' : 'Undelete Tenant'}</span>
                                        <img src="./remove-person-ico.svg" alt="tenant user" />
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal show={this.state.showAddTenantModal} onHide={this.handleCloseA} dialogClassName="add-tenant-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Add Tenant</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseA} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="tenant-profile">
              <div className="row">
                <div className="col-xs-6 header">
                  <div className="pseudo">
                    <i className="fa fa-circle"></i><span>Tenant - Profile</span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-4 tenant-picture ">
                  <img src="./tenant-photo.png" alt="tentant photo" />
                </div>
                <div className="col-xs-8 tenant-detail">
                  <div className="row">
                    <div className="col-xs-12 title">
                      <label>Company Title</label>
                      <input type="text" ref={(tenant_Title) => this.tenant_Title = tenant_Title} />
                    </div>
                    <div className="col-xs-12 username">
                      <label>Tenant Username</label>
                      <input type="text" ref={(tenant_Username) => this.tenant_Username = tenant_Username} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-6 first-name">
                  <label>Tenant First Name</label>
                  <input type="text" ref={(tenant_Firstname) => this.tenant_Firstname = tenant_Firstname} />
                </div>
                <div className="col-xs-6 last-name">
                  <label>Tenant Last Name</label>
                  <input type="text" ref={(tenant_Lastname) => this.tenant_Lastname = tenant_Lastname} />
                </div>
              </div>
              <div className="row">
                <div className="col-xs-4 address">
                  <label>Tenant Address</label>
                  <input type="text" ref={(tenant_Address) => this.tenant_Address = tenant_Address} />
                </div>
                <div className="col-xs-8 email">
                  <label>Email</label>
                  <input type="text" ref={(tenant_Email) => this.tenant_Email = tenant_Email} />
                </div>
              </div>
            </div>
            {
              this.state.setPW ? setPW_Form : setPW_Button
            }
            <div className="tenant-role">
              <div className="row">
                <div className="col-xs-6 header">
                  <div className="pseudo">
                    <i className="fa fa-circle"></i><span>Account Detail - Role</span>
                  </div>
                </div>
                <div className="col-xs-6 detail">
                  <Dropdown disabled id="tenant-role-dropdown">
                    <Dropdown.Toggle noCaret>
                      <table>
                        <tbody>
                          <tr>
                            <td><span className="level">Tenant Admin</span></td>
                            <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                          </tr>
                        </tbody>
                      </table>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="super-colors">
                      <MenuItem eventKey={{ name: 'CLIENT', parent: 'role dropdown' }} onSelect={this.select}>CLIENT</MenuItem>
                      <MenuItem eventKey={{ name: 'USER', parent: 'role dropdown' }} onSelect={this.select}>USER</MenuItem>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </div>
            <div className="request-time">
              <div className="row">
                <div className="col-xs-6 header">
                  <div className="pseudo">
                    <i className="fa fa-circle"></i><span>Request Time - Interval &amp; Cost</span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-6 time">
                  <label htmlFor="">Time Interval</label>
                  <Dropdown disabled={this.state.optionA} id="time-dropdown">
                    <Dropdown.Toggle noCaret>
                      <table>
                        <tbody>
                          <tr>
                            <td><span className="level">{this.state.selectedTime} mins</span></td>
                            <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                          </tr>
                        </tbody>
                      </table>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="super-colors">
                      <MenuItem eventKey={{ name: '15 mins', id: '15', parent: 'time dropdown' }} onSelect={this.select}>15 mins</MenuItem>
                      <MenuItem eventKey={{ name: '30 mins', id: '30', parent: 'time dropdown' }} onSelect={this.select}>30 mins</MenuItem>
                      <MenuItem eventKey={{ name: '60 mins', id: '60', parent: 'time dropdown' }} onSelect={this.select}>1 hour</MenuItem>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                <div className="col-xs-6 price">
                  <label htmlFor="">Price p/15min</label>
                  <input disabled={this.state.optionA} type="text" defaultValue="100" ref={tenant_Price => this.tenant_price = tenant_Price} />
                </div>
                <div className="col-xs-6 use-global-settings option">
                  <span>Use global settings</span>
                  <div className={this.state.optionA ? "check-item active" : "check-item"}>
                    <div className="pseudo" onClick={this.toggleOption.bind(this, 'optionA')}>
                      <img src="./checked-ico.svg" alt="checked icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="permission">
              <div className="row">
                <div className="col-xs-6 header">
                  <div className="pseudo">
                    <i className="fa fa-circle"></i><span>Permissions</span>
                  </div>
                </div>
                <div className="col-xs-6 add-remove-level-zone option">
                  <span>Add/Remove Level and Zone</span>
                  <div className={this.state.optionB ? "check-item active" : "check-item"}>
                    <div className="pseudo" onClick={this.toggleOption.bind(this, 'optionB')}>
                      <img src="./checked-ico.svg" alt="checked icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button className="btn btn-default btn-custom btn-create-request" onClick={e => {
              e.preventDefault();
              this.addNewTenant();
            }}>Request</button>
          </Modal.Body>
        </Modal>
        <Modal show={this.state.showAddUserTenantModal} onHide={this.handleCloseB} dialogClassName="add-user-tenant-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Add User to Tenant</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseB} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="user-profile">
              <div className="row">
                <div className="col-xs-4 user-picture">
                  <img src="./user-photo.png" alt="user photo" />
                </div>
                <div className="col-xs-8 user-detail">
                  <div className="row">
                    <div className="col-xs-12 title">
                      <div className="pseudo">
                        <i className="fa fa-circle"></i><span>User - Profile</span>
                      </div>
                    </div>
                    <div className="col-xs-12 username">
                      <label>Username</label>
                      <input type="text" ref={user_Username => this.user_Username = user_Username} />
                    </div>
                    <div className="col-xs-12 username">
                      <label>Company</label>
                      <Dropdown id="user-role-dropdown">
                        <Dropdown.Toggle noCaret>
                          <table>
                            <tbody>
                              <tr>
                                <td><span className="level">{this.state.selectedCompany_Name}</span></td>
                                <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                              </tr>
                            </tbody>
                          </table>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="super-colors">
                          {this.state.companiesList.map((item, index) => {
                            return (
                              <MenuItem key={index} eventKey={{ name: item.title, id: item.id, address: item.address, parent: 'company dropdown' }} onSelect={this.user_select}>{item.title}</MenuItem>
                            )
                          })}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-6 first-name">
                  <label>First Name</label>
                  <input type="text" ref={user_Firstname => this.user_Firstname = user_Firstname} />
                </div>
                <div className="col-xs-6 last-name">
                  <label>Last Name</label>
                  <input type="text" ref={user_Lastname => this.user_Lastname = user_Lastname} />
                </div>
              </div>
              <div className="row">
                <div className="col-xs-8 email">
                  <label>Email</label>
                  <input type="email" ref={user_Email => this.user_Email = user_Email} />
                </div>
              </div>
            </div>
            {
              this.state.setPW ? setPW_Form : setPW_Button
            }
            <div className="user-role">
              <table>
                <tbody>
                  <tr>
                    <td className="title" width="50%">
                      <div className="pseudo">
                        <i className="fa fa-circle"></i>
                        <span>Account Detail - Role</span>
                      </div>
                    </td>
                    <td className="detail" width="50%">
                      <Dropdown id="user-role-dropdown">
                        <Dropdown.Toggle noCaret>
                          <table>
                            <tbody>
                              <tr>
                                <td><span className="level">{this.state.selectedRole_User}</span></td>
                                <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                              </tr>
                            </tbody>
                          </table>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="super-colors">
                          <MenuItem eventKey={{ name: 'User', parent: 'role dropdown' }} onSelect={this.select}>User</MenuItem>
                          <MenuItem eventKey={{ name: 'Tenant Admin', parent: 'role dropdown' }} onSelect={this.select}>Tenant Admin</MenuItem>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button className="btn btn-default btn-custom btn-create-request" onClick={this.addNewUser}>Request</button>
          </Modal.Body>
        </Modal>
        <Modal show={this.state.showUserTenantListModal} onHide={this.handleCloseC} dialogClassName="user-tenant-list-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td width="50%">
                      <h4 className="modal-title">User List</h4>
                      <h4 className="tenant-name">{this.state.selectedCompany_Name}</h4>
                    </td>
                    <td width="42%">
                      <div className="deleted-user-check">
                        <span>Show Deleted Users</span>
                        <div className={this.state.showDeletedUser ? 'check-item active' : 'check-item'}>
                          <div className="pseudo" onClick={e => {
                            e.preventDefault();
                            this.toggleChange('User');
                          }}>
                            <img src="./checked-ico.svg" alt="check box" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td hidden rowSpan="2" width="42%">
                      <div className="level-dropdown">
                        <Dropdown id="floor-level-dropdown">
                          <Dropdown.Toggle noCaret>
                            <table>
                              <tbody>
                                <tr>
                                  <td className="lvl-name">Level 8</td>
                                  <td rowSpan="2"><span className="pull-right"><i className="fa fa-caret-down" aria-hidden="true"></i></span></td>
                                </tr>
                                <tr>
                                  <td className="lvl-position">West</td>
                                </tr>
                              </tbody>
                            </table>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="super-colors">
                            <MenuItem eventKey="1">Level 1</MenuItem>
                            <MenuItem eventKey="2">Level 2</MenuItem>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </td>
                    <td rowSpan="2" width="8%" className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseC} /></td>
                  </tr>
                  <tr>
                    <td>
                      <span className="total-user">{this.state.companyUserList.length} User total</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="user-tenant-list">
              {this.state.companyUserList.map((item, index) => {
                return (
                  <div key={index} className="utl-item">
                    <table>
                      <tbody>
                        <tr>
                          <td className={item.deleted_at != null ? 'avatar deleted' : 'avatar'} rowSpan="2">
                            {/* <img src="./user-tenant-avatar.png" alt="user tenant avatar"/> */}
                            <div className="default">
                              <span>{item.firstname.charAt(0) + item.lastname.charAt(0)}</span>
                            </div>
                          </td>
                          <td><label className={item.deleted_at != null ? 'name deleted' : 'name'}>{item.firstname} {item.lastname}</label></td>
                          <td hidden={item.deleted_at != null} className="text-right" rowSpan="2">
                            <div className="edit-user">
                              <div className="pseudo" onClick={e => {
                                e.preventDefault();
                                this.handleCloseC();
                                this.setState({ currentEditUser: item }, () => {
                                  this.getPermission('User');
                                  this.handleShowE();
                                });
                              }}>
                                <img src="./btn-edit-user-profile.png" alt="edit user icon" />
                                <span>Edit User</span>
                              </div>
                            </div>
                          </td>
                          <td hidden={item.deleted_at != null} className="text-right" rowSpan="2">
                            <div className="remove-user">
                              <div className="pseudo" onClick={e => {
                                e.preventDefault();
                                if (item.role == 'ROLE_USER') {
                                  this.deleteUser(item.username);
                                }
                                else {
                                  this.setTenantRole_Delete(item.username, 'USER');
                                }
                              }}>
                                <img src="./dark-grey-remove-person-ico.svg" alt="remove user icon" />
                                <span>Remove User</span>
                              </div>
                            </div>
                          </td>
                          <td hidden={item.deleted_at == null} className="text-right" rowSpan="2">
                            <div className="restore-user">
                              <div className="pseudo" onClick={e => {
                                e.preventDefault();
                                this.restoreUser(item);
                              }}>
                                <img src="./sync-ico.svg" alt="remove user icon" />
                                <span>Restore User</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="role"><span>{item.role == 'ROLE_USER' ? 'User' : 'Tenant Admin'}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </Modal.Body>
        </Modal>
        <Modal show={this.state.showTenantProfileModal} onHide={this.handleCloseD} dialogClassName="edit-tenant-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Tenant Profile</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseD} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="tenant-profile">
              <div className="row">
                <div className="col-xs-6 header">
                  <div className="pseudo">
                    <i className="fa fa-circle"></i><span>Tenant - Profile</span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-4 tenant-picture">
                  <input className="upload" type="file" onChange={this.handleImageChange} />
                  {this.state.imagePreviewUrl ? (isURL(this.state.imagePreviewUrl) ? <img src={this.state.imagePreviewUrl + '?k=' + uuidv1()} alt="tentant photo" /> : <img src={this.state.imagePreviewUrl} alt="tentant photo" />) : <img src="./tenant-photo.png" alt="tentant photo" />}
                </div>
                <div className="col-xs-8 tenant-detail">
                  <div className="row">
                    <div className="col-xs-12 title">
                      <label>Company Title</label>
                      <input disabled={this.state.currentCompany.deleted_at != null} type="text" defaultValue={this.state.currentCompany.title} ref={(tenant_Title) => this.tenant_Title = tenant_Title} />
                    </div>
                    <div className="col-xs-12 username">
                      <label>Tenant Username</label>
                      <input disabled={this.state.currentCompany.deleted_at != null} type="text" defaultValue={this.state.currentCompany.username} ref={(tenant_Username) => this.tenant_Username = tenant_Username} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-6 first-name">
                  <label>Tenant First Name</label>
                  <input disabled={this.state.currentCompany.deleted_at != null} type="text" defaultValue={this.state.currentCompany.firstname} ref={(tenant_Firstname) => this.tenant_Firstname = tenant_Firstname} />
                </div>
                <div className="col-xs-6 last-name">
                  <label>Tenant Last Name</label>
                  <input disabled={this.state.currentCompany.deleted_at != null} type="text" defaultValue={this.state.currentCompany.lastname} ref={(tenant_Lastname) => this.tenant_Lastname = tenant_Lastname} />
                </div>
              </div>
              <div className="row">
                <div className="col-xs-4 address">
                  <label>Tenant Address</label>
                  <input disabled={this.state.currentCompany.deleted_at != null} type="text" defaultValue={this.state.currentCompany.address} ref={(tenant_Address) => this.tenant_Address = tenant_Address} />
                </div>
                <div className="col-xs-8 email">
                  <label>Email</label>
                  <input disabled={this.state.currentCompany.deleted_at != null} type="text" defaultValue={this.state.currentCompany.email} ref={(tenant_Email) => this.tenant_Email = tenant_Email} />
                </div>
              </div>
            </div>
            <div className="tenant-role">
              <div className="row">
                <div className="col-xs-6 header">
                  <div className="pseudo">
                    <i className="fa fa-circle"></i><span>Account Detail - Role</span>
                  </div>
                </div>
                <div className="col-xs-6 detail">
                  <Dropdown disabled id="tenant-role-dropdown">
                    <Dropdown.Toggle noCaret>
                      <table>
                        <tbody>
                          <tr>
                            <td><span className="level">Tenant Admin</span></td>
                            <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                          </tr>
                        </tbody>
                      </table>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="super-colors">
                      <MenuItem eventKey={{ name: 'CLIENT', parent: 'role dropdown' }} onSelect={this.select}>CLIENT</MenuItem>
                      <MenuItem eventKey={{ name: 'USER', parent: 'role dropdown' }} onSelect={this.select}>USER</MenuItem>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </div>
            <div className="request-time">
              <div className="row">
                <div className="col-xs-6 header">
                  <div className="pseudo">
                    <i className="fa fa-circle"></i><span>Request Time - Interval &amp; Cost</span>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-6 time">
                  <label htmlFor="">Time Interval</label>
                  <Dropdown disabled={this.state.optionA || this.state.currentCompany.deleted_at != null} id="time-dropdown">
                    <Dropdown.Toggle noCaret>
                      <table>
                        <tbody>
                          <tr>
                            <td><span className="level">{this.state.selectedTime} mins</span></td>
                            <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                          </tr>
                        </tbody>
                      </table>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="super-colors">
                      <MenuItem eventKey={{ name: '15 mins', id: '15', parent: 'time dropdown' }} onSelect={this.select}>15 mins</MenuItem>
                      <MenuItem eventKey={{ name: '30 mins', id: '30', parent: 'time dropdown' }} onSelect={this.select}>30 mins</MenuItem>
                      <MenuItem eventKey={{ name: '60 mins', id: '60', parent: 'time dropdown' }} onSelect={this.select}>1 hour</MenuItem>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                <div className="col-xs-6 price">
                  <label htmlFor="">Price p/15min</label>
                  <input disabled={this.state.optionA || this.state.currentCompany.deleted_at != null} type="text" defaultValue="100" ref={tenant_Price => this.tenant_price = tenant_Price} />
                </div>
                <div className="col-xs-6 use-global-settings option">
                  <span>Use global settings</span>
                  <div className={this.state.optionA ? "check-item active" : "check-item"}>
                    <div className="pseudo" onClick={e => {
                      e.preventDefault();
                      if (this.state.currentCompany.deleted_at != null) {
                        return;
                      }
                      else {
                        this.toggleOption('optionA');
                      }
                    }}>
                      <img src="./checked-ico.svg" alt="checked icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="permission">
              <div className="row">
                <div className="col-xs-6 header">
                  <div className="pseudo">
                    <i className="fa fa-circle"></i><span>Permissions</span>
                  </div>
                </div>
                <div className="col-xs-6 add-permission">
                  <div hidden={sessionStorage.getItem('role') != 'ROLE_ADMIN'} className="buttons">
                    <div className="row">
                      <button
                        id="1"
                        type="button"
                        className="btn btn-default btn-custom btn-add-permission"
                        disabled={!this.state.levelsList}
                        onClick={e => {
                          e.preventDefault();
                          if (this.state.currentCompany.deleted_at != null) {
                            return;
                          }
                          else {
                            this.addNewPermission();
                          }
                        }}
                      >
                        <img src="./white-plus-ico.svg" alt="add tenant" />
                        <span>Add permission</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row permission-data">
                {currentPermissions}
                {this.state.newPermission.map((permission, key) => {
                  let level = permission.level.id;
                  let levelZones = zonesList[level] ? zonesList[level] : [];
                  permission.zones = orderBy(zonesList[level], [item => item.name.toLowerCase()], ['asc']);

                  if (permission.zones && permission.zones.length > 0) {
                    permission.zones.forEach(x => x.checked = false);
                    permission.zones.find(x => x.id == permission.zone.id).checked = true;
                  }

                  return (
                    <div key={key} className="row">
                      <table>
                        <tbody>
                          <tr>
                            <td width="12%" className="text-up"><label>Level:</label></td>
                            <td width="25%">
                              <div className="permission-dropdown">
                                <Dropdown id="permission-dropdown-1">
                                  <Dropdown.Toggle noCaret>
                                    <table>
                                      <tbody>
                                        <tr>
                                          <td><span className="level">{permission.level.name}</span></td>
                                          <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu className="super-colors">
                                    {
                                      this.state.levelsList.map((lvl, index) => {
                                        return (
                                          <MenuItem key={lvl.id} eventKey={{ id: key, level: lvl, parent: 'level_dropdown' }} onSelect={this.editNewPermission}>{lvl.name}</MenuItem>
                                        );
                                      })
                                    }
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </td>
                            <td width="10%"></td>
                            <td width="12%" className="text-up"><label>Zone:</label></td>
                            <td width="25%">
                              <div className="permission-dropdown">
                                <Dropdown id="permission-dropdown-2">
                                  <Dropdown.Toggle noCaret>
                                    <table>
                                      <tbody>
                                        <tr>
                                          <td><span className="level">{permission.zone.name}</span></td>
                                          <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </Dropdown.Toggle>
                                  <Dropdown.Menu className="super-colors">
                                    {
                                      levelZones.length > 1 ?
                                        <MenuItem key={uuidv1()} eventKey={permission} onSelect={this.selectAllZones}>Select all</MenuItem>
                                        : null
                                    }
                                    {permission.zones &&
                                      permission.zones.map((zone, index) => {
                                        const isChecked = zone => zone.checked;
                                        return (
                                          //<MenuItem key={index} eventKey={{name: zone.name, id: zone.id, parent: 'zone_dropdown'}} onSelect={this.editPermission}>{zone.name}</MenuItem>                              
                                          <MenuItem key={uuidv1()} eventKey={{ parent: 'zone_dropdown', zone: zone, permission: permission }} onSelect={this.editNewPermission}>
                                            <input type="checkbox" checked={isChecked(zone)} /> {zone.name}
                                          </MenuItem>
                                        );
                                      })
                                    }
                                  </Dropdown.Menu>
                                </Dropdown>
                              </div>
                            </td>
                            <td width="10%"></td>
                            <td width="12%" className="text-up">
                              <img src="./circle-trash-ico.svg" className="btn-delete" alt="trash icon" onClick={e => {
                                e.preventDefault();
                                this.deleteNewPermission(key);
                              }} />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
            <button className="btn btn-default btn-custom btn-create-request" onClick={e => {
              e.preventDefault();
              if (this.state.currentCompany.deleted_at != null) {
                return;
              }
              else {
                this.updateTenantProfile();
              }
            }}>Save</button>
          </Modal.Body>
        </Modal>
        <Modal show={this.state.showEditUserTenantModal} onHide={this.handleCloseE} dialogClassName="add-user-tenant-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Edit User Tenant</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseE} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="user-profile">
              <div className="row">
                <div className="col-xs-4 user-picture">
                  <img src="./user-photo.png" alt="user photo" />
                </div>
                <div className="col-xs-8 user-detail">
                  <div className="row">
                    <div className="col-xs-12 title">
                      <div className="pseudo">
                        <i className="fa fa-circle"></i><span>User - Profile</span>
                      </div>
                    </div>
                    <div className="col-xs-12 username">
                      <label>Username</label>
                      <input type="text" defaultValue={this.state.currentEditUser.username} ref={user_Username => this.user_Username = user_Username} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-6 first-name">
                  <label>First Name</label>
                  <input type="text" defaultValue={this.state.currentEditUser.firstname} ref={user_Firstname => this.user_Firstname = user_Firstname} />
                </div>
                <div className="col-xs-6 last-name">
                  <label>Last Name</label>
                  <input type="text" defaultValue={this.state.currentEditUser.lastname} ref={user_Lastname => this.user_Lastname = user_Lastname} />
                </div>
              </div>
              <div className="row">
                <div className="col-xs-8 email">
                  <label>Email</label>
                  <input type="email" defaultValue={this.state.currentEditUser.email} ref={user_Email => this.user_Email = user_Email} />
                </div>
              </div>
            </div>
            <div className="user-role">
              <table>
                <tbody>
                  <tr>
                    <td className="title" width="50%">
                      <div className="pseudo">
                        <i className="fa fa-circle"></i>
                        <span>Account Detail - Role</span>
                      </div>
                    </td>
                    <td className="detail" width="50%">
                      <Dropdown id="user-role-dropdown">
                        <Dropdown.Toggle noCaret>
                          <table>
                            <tbody>
                              <tr>
                                <td><span className="level">{this.state.selectedRole_User}</span></td>
                                <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                              </tr>
                            </tbody>
                          </table>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="super-colors">
                          <MenuItem eventKey={{ name: 'User', parent: 'role dropdown' }} onSelect={this.select}>User</MenuItem>
                          <MenuItem eventKey={{ name: 'Tenant Admin', parent: 'role dropdown' }} onSelect={this.select}>Tenant Admin</MenuItem>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="permission">
              <table>
                <div className="row">
                  <div className="col-xs-6 header">
                    <div className="pseudo">
                      <i className="fa fa-circle"></i><span>Permissions</span>
                    </div>
                  </div>
                </div>
                <div className="row permission-data">
                  {this.currentUserPermissions()}

                  {this.state.newPermission.map((permission, key) => {
                    let level = permission.level.id;
                    let levelZones = [];
                    if (Object.keys(this.state.ablePermissions).length > 0) {
                      this.state.ablePermissions.levels.forEach((item, index) => {
                        if (item.id == level) {
                          levelZones = item.zones;
                        }
                      });
                    }

                    return (
                      <div key={key} className="row">
                        <table>
                          <tbody>
                            <tr>
                              <td width="12%" className="text-up"><label>Level:</label></td>
                              <td width="25%">
                                <div className="permission-dropdown">
                                  <Dropdown id="permission-dropdown-1">
                                    <Dropdown.Toggle noCaret>
                                      <table>
                                        <tbody>
                                          <tr>
                                            <td><span className="level">{permission.level.name}</span></td>
                                            <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="super-colors">
                                      {
                                        this.state.ablePermissions && this.state.ablePermissions.levels ? this.state.ablePermissions.levels.map((lvl, index) => {
                                          return (
                                            <MenuItem key={index} eventKey={{ id: key, level: lvl, parent: 'level_dropdown', number: index }} onSelect={this.editNewPermission_User}>{lvl.name}</MenuItem>
                                          );
                                        }) : null
                                      }
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                              </td>
                              <td width="10%"></td>
                              <td width="12%" className="text-up"><label>Zone:</label></td>
                              <td width="25%">
                                <div className="permission-dropdown">
                                  <Dropdown id="permission-dropdown-2">
                                    <Dropdown.Toggle noCaret>
                                      <table>
                                        <tbody>
                                          <tr>
                                            <td><span className="level">{permission.zone ? permission.zone.name : ''}</span></td>
                                            <td><span className="pull-right"><img src="./down-arrow-ico.svg" alt="down arrow" /></span></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="super-colors">
                                      {
                                        levelZones.map((zone, index) => {
                                          return (
                                            <MenuItem key={index} eventKey={{ id: key, zone: zone, parent: 'zone_dropdown' }} onSelect={this.editNewPermission_User}>{zone.name}</MenuItem>
                                          );
                                        })
                                      }
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                              </td>
                              <td width="10%"></td>
                              <td width="12%" className="text-up">
                                <img src="./circle-trash-ico.svg" className="btn-delete" alt="trash icon" onClick={e => {
                                  e.preventDefault();
                                  this.deleteNewPermission(key);
                                }} />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              </table>
            </div>
            <button className="btn btn-default btn-custom btn-create-request" onClick={this.updateUserProfile}>Save</button>
          </Modal.Body>
        </Modal>
        <Footer />
      </div>
    );
  }
}