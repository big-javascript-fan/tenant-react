import React from 'react';
import config from 'config';
import {Dropdown, MenuItem, Modal} from 'react-bootstrap';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import SettingControl from 'components/SettingControl';

export default class AdminUsers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAddAdminUserModal: false,
      showAddEmailReceiver: false,
      showEditAdminUserModel: false,
      adminList: [],
      currentAdmin: {},
      email: '',
      emailArray: [],
      invalidEmail: 0,
      oldEmail: [],
      newEmail: {},
      existedEmail: {}
    };
  }
  componentDidMount() {
    const params = {
      include_deleted: false,
    };
    const esc = encodeURIComponent
    const query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&')
    const requestUrl = config.serverUrl + config.api.admin_list + query;
    let status;
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
        if(Array.isArray(res) && res.length > 0){
          this.setState({ adminList: res });
        }
      })
      .catch((error) => {
        console.log(error);
      });
    this.getUpdateEmail();
  }

  handleCloseA = () => {
    this.setState({showAddAdminUserModal: false});
  };

  handleShowA = (type) => {
    this.setState({showAddAdminUserModal: true});
  };

  handleCloseB = () => {
    this.setState({
      showAddEmailReceiver: false,
      emailArray: [],
      oldEmail: [],
      newEmail: {},
      existedEmail: {}
    });
  };

  handleShowB = (type) => {
    this.setState({showAddEmailReceiver: true});
    this.getEmailForEdit();
  };
  
  handleCloseC = () => {
    this.setState({showEditAdminUserModal: false});
    this.setState({currentAdmin: ''});
  };
  
  handleShowC = (admin) => {
    this.setState({showEditAdminUserModal: true});
    this.setState({currentAdmin: admin});
  };
  
  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      this.setState({ [key]: target.value });
    }
  }
  
  countInvalidEmail = () => {
    let emailsList = this.state.emailArray;
    let count = 0;
    let i=0;
    emailsList.forEach((email, index) => {
      if(this.emailValidation(email) == false){
        count ++;
      }
      if(i == emailsList.length -1){
        this.setState({ invalidEmail: count});
      }
      i++
    });
    
  }
  
  emailChange = (index, value) => {
    let array = this.state.emailArray;
    let emailList = this.state.newEmail;
    array[index] = value;
    emailList[index] = value;
    this.setState({
      emailArray: array,
      newEmail: emailList,
    }, () => {
      this.countInvalidEmail();
    });
  }
  
  emailValidation = (email) => {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  
  checkExistedEmail = () => {
    let currentEmails = this.state.oldEmail;
    let emailsList = this.state.newEmail;
    let existed = {};
    let i = 0;
    let result;
    for(let key in emailsList){
      let j = 0;
      currentEmails.forEach((email, index) => {
        if(emailsList[key] == email){
          existed[key] = email;
        }
        if(j == currentEmails.length -1 && i == Object.keys(emailsList).length -1){
          if(Object.keys(existed).length > 0){
            this.setState({existedEmail: existed});
            result = false;
          }
          else{
            result = true;
          }
        }
        j++;
      })
      i++;
    }
    return result;
  }
  
  getUpdateEmail = () => {
    const requestUrl = config.serverUrl + config.api.settings;
    let status;
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
        if(Object.keys(res).length > 0){
          this.setState({
            email: res.req_notif
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  getEmailForEdit = () => {
    const requestUrl = config.serverUrl + config.api.settings;
    let status;
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
        if(Object.keys(res).length > 0){
          let array = res.req_notif.split(',');
          this.setState({
            emailArray: array.slice(0),
            oldEmail: array.slice(0)
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  addNewAdmin = () => {
   if(this.ad_Username.value.length > 0 && this.ad_Email.value.length >0 && this.ad_Email.value.length > 0 && this.ad_Address.value.length > 0 && this.ad_Password.value.length > 0 && this.ad_Password.value === this.ad_Password_confirm.value){
     const requestUrl = config.serverUrl + config.api.admin_action;
     let status;
     let cache = [];
     let data = {
       username: this.ad_Username.value,
       email: this.ad_Email.value,
       firstname: this.ad_Firstname.value,
       lastname: this.ad_Lastname.value,
       address: this.ad_Address.value,
       note: this.ad_Note.value,
       password: this.ad_Password.value,
     };
     fetch(requestUrl, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
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
       .then((response) => {
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
          else{
            this.componentDidMount();
            this.handleCloseA();
          }
       })
       .catch((error) => {
         console.log(error);
       });
   }
   else if(this.ad_Password.value !== this.ad_Password_confirm.value){
     alert('Password must be match');
   }
   else {
     alert('Please enter all required fields');
   }
  }
  
  editInfo = (admin) => {
    if( this.edit_Username.value.length != 0 && this.edit_Email.value.length != 0 && this.edit_Firstname.value.length != 0 && this.edit_Lastname.value.length != 0 && this.edit_Address.value.length != 0 ){
      const params = {
        username: admin.username,
      };
      const esc = encodeURIComponent;
      const query = Object.keys(params)
        .map(k => esc(params[k]))
        .join('&');
      const requestUrl = config.serverUrl + config.api.admin_action + '/' + query;
      let cache = [];
      let status;
      const data = {
        username: this.edit_Username.value,
        email: this.edit_Email.value,
        firstname: this.edit_Firstname.value,
        lastname: this.edit_Lastname.value,
        address: this.edit_Address.value,
        note: this.edit_Note.value,
      };
      fetch(requestUrl, {
        method: 'PUT',
        headers: {
          "accept": "application/json",
          'Content-Type': 'application/json',
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
        .then((response) => {
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
          else{
            this.componentDidMount();
            this.handleCloseC();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else {
      alert('All required fields must not empty');
    }
  }
  
  deleteAdmin = (item) => {
    const params = {
      username: item.username,
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(params[k]))
      .join('&');
    const requestUrl = config.serverUrl + config.api.admin_action + '/' + query;
    let status;
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      },
    })
      .then((response) => {
        status = response.status;
        if(status != 204){
          return response.json();
        }
      })
      .then((res) => {
        if(status != 204) alert(res.errors);
        else this.componentDidMount();
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  restore = (item) => {
    const requestUrl = config.serverUrl + config.api.admin_action + '/' + item.username + '/restore';
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
        return res;
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  deleteEmail = (index) => {
    let array = this.state.emailArray;
    let obj = this.state.newEmail
    let obj_2 = this.state.existedEmail;
    if(obj[index]){
      delete obj[index];
    }
    if(obj_2[index]){
      delete obj_2[index];
    }
    array.splice(index, 1);
    this.setState({
      emailArray: array,
      newEmail: obj,
      existedEmail: obj_2
    }, () => {
      this.countInvalidEmail();
    });
  }
  
  addEmail = () =>{
    let array = this.state.emailArray;
    let emaiList = this.state.newEmail;
    let email = '';
    let index = this.state.emailArray.length;
    array.push(email);
    emaiList[index] = email;
    this.setState({
      emailArray: array,
      newEmail: emaiList }, () => {
      this.countInvalidEmail();
    });
  }
  
  addEmailReceiver = () => {
    let requestUrl = config.serverUrl + config.api.settings;
    let string = '';
    let i = 0;
    this.state.emailArray.forEach((email, index) => {
      if(email != ''){
        if(string == '') {
          string = string + email.toString().trim();
        }
        else{
          string = string + ',' + email.toString().trim();
        }
      }
      i++;
    });
    let data = {
      req_notif: string.trim()
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
          this.handleCloseB();
          this.getUpdateEmail();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  render() {
    const listItem = this.state.adminList.map((item, index) =>{
      return (
      <tr key={index} className="al-item">
        <td><span>{item.username}</span></td>
        <td><span>{item.email}</span></td>
        <td><span>{item.firstname}</span></td>
        <td><span>{item.lastname}</span></td>
        <td><span>{(item.address === null || item.address.length == 0) ? '_' : item.address }</span></td>
        <td><span>{(item.note === null || item.note.length == 0) ? '_' : item.note }</span></td>
        <td className="text-right">
          <img src="./circle-edit-ico.svg" className="btn-edit" alt="edit icon" onClick={e => {
            e.preventDefault();
            this.handleShowC(item);
          }} />
          <img src="./circle-trash-ico.svg" className="btn-delete" alt="trash icon" onClick={e => {
            e.preventDefault();
            if(confirm('Delete admin: ' + item.username + ' ?')){
              this.deleteAdmin(item);
            }
          }} />
        </td>
      </tr>
      );
    });
    return (
      <div className="admin-users">
        <Navigation {...this.props} />
        <SettingControl {...this.props} />
        <div className="au-detail container">
          <div className="aud-pseudo">
            <div className="add-admin-user">
              <div className="row">
                <div className="col-xs-6 title">
                  <h4>Admin Users</h4>
                </div>
                <div className="col-xs-6 text-right">
                  <button type="button" className="btn btn-default btn-custom btn-add-admin-user" onClick={this.handleShowA}>Add System Admin</button>
                </div>
              </div>
            </div>
            <div className="admin-list">
              <table>
                <tbody>
                  <tr className="header">
                    <td>
                      <img src="./user-ico-2.svg" alt="user icon"/>
                      <label>Username</label>
                    </td>
                    <td>
                      <img src="./email-ico.svg" alt="email icon"/>
                      <label>Email</label>
                    </td>
                    <td>
                      <img src="./id-card-ico.svg" alt="firstname"/>
                      <label>Firstname</label>
                    </td>
                    <td>
                      <img src="./id-card-ico.svg" alt="lastname"/>
                      <label>Lastname</label>
                    </td>
                    <td>
                      <img src="./address-ico.svg" alt="address icon"/>
                      <label>Address</label>
                    </td>
                    <td>
                      <img src="./notes-ico.svg" alt="note icon"/>
                      <label>Note</label>
                    </td>
                    <td></td>
                  </tr>
                  {listItem}
                </tbody>
              </table>
            </div>
            <div className="add-update-email-receiver">
              <div className="row">
                <div className="col-md-8">
                  <span>List of email that will receive notification when user create AHAC request</span>
                  <span className="email-list">{this.state.email}</span>
                </div>
                <div className="col-md-4 text-right">
                  <button className="btn btn-default btn-custom btn-add-update-email-receiver" onClick={this.handleShowB}>Add / Update Email Receiver</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Modal show={this.state.showAddAdminUserModal} onHide={this.handleCloseA} dialogClassName="add-admin-user-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">New Admin Users</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseA} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="admin-detail">
              <div className="username">
                <label>Username</label>
                <input type="text" ref={(ad_Username) => this.ad_Username = ad_Username} />
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <div className="first-name">
                    <label>First Name</label>
                    <input type="text" ref={(ad_Firstname) => this.ad_Firstname = ad_Firstname} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="last-name">
                    <label>Last Name</label>
                    <input type="text" ref={(ad_Lastname) => this.ad_Lastname = ad_Lastname} />
                  </div>
                </div>
              </div>
              <div className="email">
                <label>Email</label>
                <input type="email" ref={(ad_Email) => this.ad_Email = ad_Email} />
              </div>
              <div className="address">
                <label>Address</label>
                <input type="text" ref={(ad_Address) => this.ad_Address = ad_Address} />
              </div>
              <div className="note">
                <label>Note</label>
                <input type="text" placeholder="Some note" ref={(ad_Note) => this.ad_Note = ad_Note} />
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <div className="password">
                    <label>Password</label>
                    <input type="password" ref={(ad_Password) => this.ad_Password = ad_Password} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="confirm-password">
                    <label>Confirm Password</label>
                    <input type="password" ref={(ad_Password_confirm) => this.ad_Password_confirm = ad_Password_confirm}/>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <button className="btn btn-default btn-custom btn-add-admin-user" onClick={this.addNewAdmin}>Add</button>
        </Modal>
        <Modal show={this.state.showAddEmailReceiver} onHide={this.handleCloseB} dialogClassName="add-email-receiver-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                  <tr>
                    <td><h4 className="modal-title">Add Email Receiver</h4></td>
                    <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseB} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="email-receiver-detail">
              <div className="row">
                <div className="col-md-2">
                  <label>Email</label>
                </div>
                <div className="col-md-10">
                  <div className="buttons">
                    <button type="button" className="btn btn-default btn-custom btn-add-email" onClick={this.addEmail}>
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="email-container">
                {this.state.emailArray.map((email, index) => {
                return(
                  <div key={index} className="row email-wrapper">
                    <div className="col-md-10">
                      <input type="email" value={email} onChange={e => {
                        e.preventDefault();
                        this.emailChange(index, e.target.value);
                        this.countInvalidEmail();
                      }}/>
                      <span hidden={this.emailValidation(email) == true}>Invalid Email</span>
                      <span hidden={this.state.existedEmail[index] ? false : true}>This email already used</span>
                    </div>
                    <div className="col-md-2">
                      <img src="./circle-trash-ico.svg" className="btn-delete" alt="trash icon" onClick={e => {
                        e.preventDefault();
                        this.deleteEmail(index);
                      }}/>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          </Modal.Body>
          <button className="btn btn-default btn-custom btn-add-email-receiver" onClick={e => {
            e.preventDefault();
            if(this.state.invalidEmail == 0){
              if(Object.keys(this.state.newEmail).length > 0){
                let temp = this.checkExistedEmail();
                if(this.checkExistedEmail() == true){
                  this.addEmailReceiver();
                }
              }
              else{
                this.addEmailReceiver();
              }
            }
          }}>Save</button>
        </Modal>
        <Modal show={this.state.showEditAdminUserModal} onHide={this.handleCloseC} dialogClassName="add-admin-user-modal-dialog">
          <Modal.Header>
            <div className="mh-pseudo">
              <table>
                <tbody>
                <tr>
                  <td><h4 className="modal-title">Edit Admin Users</h4></td>
                  <td className="text-right"><img className="close-modal" src="./close-ico.svg" alt="close icon" onClick={this.handleCloseC} /></td>
                </tr>
                </tbody>
              </table>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className="admin-detail">
              <div className="username">
                <label>Username</label>
                <input type="text" defaultValue={this.state.currentAdmin.username} ref={(edit_Username) => this.edit_Username = edit_Username} />
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <div className="first-name">
                    <label>First Name</label>
                    <input type="text" defaultValue={this.state.currentAdmin.firstname} ref={(edit_Firstname) => this.edit_Firstname = edit_Firstname} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="last-name">
                    <label>Last Name</label>
                    <input type="text" defaultValue={this.state.currentAdmin.lastname} ref={(edit_Lastname) => this.edit_Lastname = edit_Lastname} />
                  </div>
                </div>
              </div>
              <div className="email">
                <label>Email</label>
                <input type="email"  defaultValue={this.state.currentAdmin.email} ref={(edit_Email) => this.edit_Email = edit_Email} />
              </div>
              <div className="address">
                <label>Address</label>
                <input type="text" defaultValue={this.state.currentAdmin.address} ref={(edit_Address) => this.edit_Address = edit_Address} />
              </div>
              <div className="note">
                <label>Note</label>
                <input type="text" defaultValue={this.state.currentAdmin.note} ref={(edit_Note) => this.edit_Note = edit_Note} />
              </div>
            </div>
          </Modal.Body>
          <button className="btn btn-default btn-custom btn-add-admin-user" onClick={e => {
            e.preventDefault();
            this.editInfo(this.state.currentAdmin);
          }} >Save</button>
        </Modal>
        <Footer {...this.props} />
      </div>
    );
  }
}