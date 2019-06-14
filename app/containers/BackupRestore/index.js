import React from 'react';
import config from 'config';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import SettingControl from 'components/SettingControl';
import moment from 'moment';

export default class BackupRestore extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      optionTables: [],
      checkedTab: 'backup',
      backupsList: [],
      currentFileName: '',
    }
  }

  toggleOption = (parent, key) => {
    let name = 'option' + parent;
    let option = this.state[name];
    for(let id in option[0]){
      if(id == key){
        option[0][id] = true;
      }
      else{
        option[0][id] = false;
      }
    }
    this.setState({
      [name]: option,
      currentFileName: key,
    });
  }

  selectTab = (name) => {
    if(name) {
      this.setState({checkedTab: name});
    }
  }
  
  componentDidMount(){
    this.getBackUp();
  }
  
  getBackUp = () => {
    const requestUrl = config.serverUrl + config.api.backups;
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
        if(Array.isArray(res)){
          if(res.length == 0){
            this.setState({
              backupsList: res,
              optionTables: []
            });
          }
          else{
            let list = new Array();
            let obj = {};
            let i = 0;
            res.forEach((backup, index) => {
              obj[backup.file_name] = false;
              if(i < res.length - 1){
                i++;
              }
              else{
                list.push(obj);
                this.setState({
                  backupsList: res,
                  optionTables: list,
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
  
  createBackUp = () => {
    const requestUrl = config.serverUrl + config.api.backups;
    let status;
    fetch(requestUrl, {
      method: 'POST',
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
        if(status == 200){
          this.getBackUp();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  showFile = (blob) => {
    // It is necessary to create a new blob object with mime-type explicitly set
    // otherwise only Chrome works like it should
    var newBlob = new Blob([blob], {type: "application/csv"})
    
    // IE doesn't allow using a blob object directly as link href
    // instead it is necessary to use msSaveOrOpenBlob
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(newBlob);
      return;
    }
    // For other browsers:
    // Create a link pointing to the ObjectURL containing the blob.
    const data = window.URL.createObjectURL(newBlob);
    let link = document.createElement('a');
    link.href = data;
    
    link.download = this.state.currentFileName;
    
    link.click();
    setTimeout(function(){
        // For Firefox it is necessary to delay revoking the ObjectURL
        window.URL.revokeObjectURL(data); }
      , 100);
  }
  
  downloadBackUp = () => {
    if(this.state.currentFileName.length > 0){
      const requestUrl = config.serverUrl + config.api.backups + '/' + this.state.currentFileName;
      let status;
      fetch(requestUrl, {
        method: 'GET',
        headers: {
          "accept": "application/json",
          "Authorization": sessionStorage.getItem('token')
        },
      })
        .then(response => {
          return response.blob();
        })
        .then((res) => {
          this.showFile(res);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  
  deleteBackUp = (file_name) => {
    const requestUrl = config.serverUrl + config.api.backups + '/' + file_name;
    let status;
    fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        "accept": "application/json",
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        status = response.status;
      })
      .then((res) => {
        if(status == 204){
          this.getBackUp();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  handleChange = (e) => {
    let file = e.target.files[0];
    let reader = new FileReader();
  
    reader.onloadend = () => {
      this.setState({
        file: file,
      });
    };
  
    reader.readAsDataURL(file);
  }
  
  restoreUpload = () => {
    if(this.state.file){
      const formData = new FormData();
      formData.append('file', this.state.file);
      let requestUrl = config.serverUrl + config.api.restore;
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
          if(status == 200){
            alert(res.message);
          }
          else{
            alert(res.errors);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  
  restoreOnWeb = () => {
    if(this.state.currentFileName.length > 0){
      const requestUrl = config.serverUrl + config.api.restore + '/' + this.state.currentFileName;
      let status;
      fetch(requestUrl, {
        method: 'PUT',
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
          if(status == 200){
            alert(res.message);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
  
  render() {
    let view = null;
    
    let restoreNoItem = (
      <div className="choose-file">
        <input className="upload" type="file" onChange={this.handleChange}/>
        <img src="./choose-file.png" alt="choose file"/>
      </div>
    );
    
    let restoreWithItem = (
      <div className="tbo-item">
        <span>{this.state.file ? this.state.file.name : ''}</span>
        <div className="delete-wrapper">
          <img src="./circle-trash-ico.svg" className="btn-delete" alt="trash icon" onClick={e => {
            e.preventDefault();
            this.setState({file: null});
          }} />
        </div>
      </div>
    );
    
    if(this.state.checkedTab == 'backup') {
      view = (
        <div className="content backup">
          <h4>Select Table to Backup</h4>
          <div className="table-options">
            <div className="row backup-wrapper">
              {
                this.state.backupsList.map((backup, index) => {
                  return (
                    <div key={index} className="col-lg-8">
                      <div className="tbo-item">
                        <div className={this.state.optionTables[0][backup.file_name] ? 'check-item active' : 'check-item'}>
                          <div className="pseudo" onClick={this.toggleOption.bind(this, 'Tables', backup.file_name)}>
                            <img src="./checked-ico.svg" alt="check box"/>
                          </div>
                        </div>
                        <div className="content">
                          <span>{backup.file_name}</span>
                          <span>Date: {moment(backup.created_at).local().format('D-MMM-YYYY / HH:mm:ss A')}</span>
                        </div>
                        <div className="delete-wrapper">
                          <img src="./circle-trash-ico.svg" className="btn-delete" alt="trash icon" onClick={e => {
                            e.preventDefault();
                            if(confirm('Do you want to delete: ' + backup.file_name.toString() + ' ?')){
                              this.deleteBackUp(backup.file_name);
                            }
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
          <div className="col-md-4">
            <button type="button" className="btn btn-default btn-custom btn-backup" onClick={this.createBackUp}>Create Backup</button>
          </div>
          <div className="col-md-4">
            <button type="button" className="btn btn-default btn-custom btn-backup" onClick={this.downloadBackUp}>Download Backup</button>
          </div>
          <div className="col-md-4">
            <button type="button" className="btn btn-default btn-custom btn-backup" onClick={this.restoreOnWeb}>Restore</button>
          </div>
        </div>
      );
    } else if (this.state.checkedTab == 'restore') {
      view = (
        <div className="content restore">
          <h4>Select Table to Backup</h4>
          {this.state.file ? restoreWithItem : restoreNoItem}
          <button type="button" className="btn btn-default btn-custom btn-restore" onClick={this.restoreUpload}>Restore</button>
        </div>
      );
    }

    return (
      <div className="backup-restore">
        <Navigation {...this.props} />
        <SettingControl {...this.props} />
        <div className="br-detail container">
          <div className="brd-pseudo">
            <div className="row">
              <div className="col-md-3">
                <div className="left-sidebar">
                  <ul className="list">
                    <li className={this.state.checkedTab == 'backup' ? 'li-item active' : 'li-item'}>
                      <div className="pseudo" onClick={this.selectTab.bind(this, 'backup')}>
                        <i className="fa fa-circle"></i><span>Backup</span>
                      </div>
                    </li>
                    <li className={this.state.checkedTab == 'restore' ? 'li-item active' : 'li-item'}>
                      <div className="pseudo" onClick={this.selectTab.bind(this, 'restore')}>
                        <i className="fa fa-circle"></i><span>Restore</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-md-9">
                {view}
              </div>
            </div>
          </div>
        </div>
        <Footer {...this.props} />
      </div>
    );
  }
}