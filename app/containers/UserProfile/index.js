import React from 'react';
import config from 'config';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';


export default class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      Firstname: '',
      Lastname: '',
      Email: '',
      Address: '',
      Note: '',
      setPW: false,
      NewPassword: '',
      RepeatNewPassword: ''
    }
  }
  componentDidMount() {
    let status;
    const requestUrl = config.serverUrl + config.api.users + '/me';
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token'),
      }
    })
      .then((response) => {
        status = response.status;
        return response.json();
      })
      .then((res) => {
        if (status == 200) {
          this.setState({
            Firstname: res.firstname,
            Lastname: res.lastname,
            Email: res.email,
            Address: res.address,
            Note: res.note
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  changeValue = (e) => {
    const target = e.target;
    const key = target.getAttribute('data-state-key');
    if (key) {
      this.setState({ [key]: target.value });
    }
  }

  editUserProfile = () => {
    if (this.state.setPW == true) {
      this.changePasswordAndUpdateProfile();
    } else {
      this.updateProfile();
    }
  }

  updateProfile = () => {
    console.log('Start of Update Profile');
    if (this.state.Firstname != '' && this.state.Lastname != '' && this.state.Email != '') {
      const requestUrl = config.serverUrl + config.api.users + '/me';
      let data = {
        username: sessionStorage.getItem('username'),
        email: this.state.Email,
        firstname: this.state.Firstname,
        lastname: this.state.Lastname,
        address: this.state.Address,
        note: this.state.Note
      }
      fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "accept": "application/json",
          'Authorization': sessionStorage.getItem('token')
        },
        body: JSON.stringify(data),
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
            console.log('End of Update Profile');
            this.componentDidMount();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  changePasswordAndUpdateProfile = () => {
    if (this.state.NewPassword != '' && this.state.RepeatNewPassword != '' && this.state.NewPassword == this.state.RepeatNewPassword) {
      const requestUrl = config.serverUrl + config.api.users + '/change_password';
      let data = {
        old_password: sessionStorage.getItem('password'),
        new_password: this.state.NewPassword
      }
      fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "accept": "application/json",
          'Authorization': sessionStorage.getItem('token')
        },
        body: JSON.stringify(data),
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
          } else {
            console.log('Successfully chaged password');
            const username = sessionStorage.getItem('username');
            sessionStorage.setItem('token', 'Basic ' + btoa(username + ':' + this.state.NewPassword));
            sessionStorage.setItem('password', this.state.NewPassword);
            console.log('End of Change Password');
            this.updateProfile();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
    else if (this.state.NewPassword != this.state.RepeatNewPassword) {
      alert('Password must be match');
    }
    else {
      alert('Please fill all required fields');
    }
  }

  render() {
    const setPW_Button = (
      <div className="set-password">
        <button className="btn btn-default btn-custom" onClick={e => {
          this.setState({ setPW: true });
        }}>
          <img src="./white-lock-ico.svg" alt="user icon" />
          <span>Change Password</span>
        </button>
      </div>
    );
    const setPW_Form = (
      <div>
        <div className="data password">
          <label className="data-title">Password</label>
          <div className="value">
            <input type="password" data-state-key="NewPassword" value={this.state.NewPassword} onChange={this.changeValue} placeholder="New password here" />
          </div>
        </div>
        <div className="data confirm-password">
          <label className="data-title">Confirm Password</label>
          <div className="value">
            <input type="password" data-state-key="RepeatNewPassword" value={this.state.RepeatNewPassword} onChange={this.changeValue} placeholder="Confirm new password" />
          </div>
        </div>
      </div>
    );
    return (
      <div className="edit-user-profile">
        <Navigation {...this.props} />
        <div className="container">
          <div className="profile-content">
            <h1 className="title">{this.state.setPW ? 'Edit Profile' : 'Your Profile'}</h1>
            <div className="profile-wrapper">
              <div className="data">
                <label className="data-title">First Name</label>
                <div className="value">
                  <input data-state-key="Firstname" value={this.state.Firstname} onChange={this.changeValue} />
                </div>

              </div>
              <div className="data">
                <label className="data-title">Last Name</label>
                <div className="value">
                  <input data-state-key="Lastname" value={this.state.Lastname} onChange={this.changeValue} />
                </div>
              </div>
              <div className="data">
                <label className="data-title">Email</label>
                <div className="value">
                  <input data-state-key="Email" value={this.state.Email} onChange={this.changeValue} />
                </div>
              </div>
              <div className="data">
                <label className="data-title">Address</label>
                <div className="value">
                  <input data-state-key="Address" value={this.state.Address} onChange={this.changeValue} />
                </div>
              </div>
              <div className="data">
                <label className="data-title">Note</label>
                <div className="value">
                  <input data-state-key="Note" value={this.state.Note} onChange={this.changeValue} />
                </div>
              </div>
              {this.state.setPW ? setPW_Form : null}
              <div className="save-user-profile">
                <div className="row">
                  <div className="col-sm-4 text-right">
                    <div className="save-profile">
                      <button className="btn btn-default btn-custom btn-save-user-profile" onClick={this.editUserProfile}>Save</button>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    {this.state.setPW == false ? setPW_Button : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer {...this.props} />
      </div>
    )
  }
}