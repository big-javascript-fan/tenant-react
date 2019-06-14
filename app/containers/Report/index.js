import React from 'react';
import config from 'config';
import {Dropdown, MenuItem, Modal} from 'react-bootstrap';
import Navigation from 'components/Navigation';
import Footer from 'components/Footer';
import moment from 'moment';
import uuidv1 from 'uuid';

export default class Report extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      optionTenants: [],
      showTenantDropdown: false,
      isInsideDropdown: false,
      chosenDay: null,
      chosenMonth: {},
      chosenYear: null,
      currentYear: null,
      companiesString: 'None selected',
      totalsHour: 0,
      totalsCost: 0,
      daysList: [],
      optionAllSchedules: false,
      optionDeletedSchedules: false,
    }
  }

  toggleOption = (parent, key) => {
    if(parent) {
      let name = 'option' + parent;
      let option = this.state[name];
      let status = option[0][key].status;
      option[0][key].status = !status;
      this.setState({[name]: option},() => {
        this.setSelectCompanyString();
        this.getReport();
      });
    } else {
      let name = 'option' + key;
      let status = this.state[name];
      this.setState({[name] : !status},() => {
        this.setSelectCompanyString();
        this.getReport();
      });
    }
    
  }

  toggleDropdown = () => {
    let status = this.state.showTenantDropdown;
    this.setState({showTenantDropdown: !status}, () => {
      if(this.state.showTenantDropdown) {
        document.body.addEventListener('click', this.closeDropdown);
      }
    });
  }
  
  select = (eventKey) => {
    if(eventKey.parent == 'month_dropdown'){
      this.setState({chosenMonth: {
        name: eventKey.name,
        value: parseInt(eventKey.id),
      }}, () => {
        this.getReport();
      })
    }
    else {
      this.setState({chosenYear: parseInt(eventKey.name)}, () => this.getReport())
    }
  }

  setSelectCompanyString = () => {
    let temp = this.state.optionTenants[0];
    let i = 0;
    let count = 0;
    let array = new Array();
    for(let key in temp){
      if(temp[key].status == true){
        array.push(key);
        count ++;
      }
      if(i == Object.keys(temp).length -1){
        if(count == 0){
          this.setState({
            companiesString: 'None selected',
            totalsHour: 0,
            totalsCost: 0,
            daysList: []
          });
        }
        else{
          let string = '';
          let j = 0;
          if(count < 3){
            let k = 0;
            array.forEach((name, index) => {
              if(k == array.length -1){
                string = string + name;
                this.setState({companiesString: string});
              }
              else{
                string = string + name + ',';
                k++;
              }
            })
          }
          else{
            string = count.toString() + ' selected';
            this.setState({companiesString: string});
          }
        }
      }
      else{
        i++;
      }
    }
  }
  
  closeDropdown = () => {
    if(this.state.isInsideDropdown == false) {
      this.setState({showTenantDropdown: false});
      document.body.removeEventListener('click', this.closeDropdown);
      event.stopPropagation();
    }
  }

  insideDropdown = () => {
    this.setState({isInsideDropdown: true});
  }

  outsideDropdown = () => {
    this.setState({isInsideDropdown: false});
  }
  
  requestsList = (list) => {
    let views = [];
    list.forEach((request, index) => {
      let view = (
          <tr key={index} className="tl-item">
            <td><span>{request.client}</span></td>
            <td><span>{request.user}</span></td>
            <td><span>{request.submission}</span></td>
            <td><span>{request.purpose}</span></td>
            <td><span>{request.start}</span></td>
            <td><span>{request.end}</span></td>
            <td><span>{request.level}</span></td>
            <td><span>{request.zone}</span></td>
            <td><span>${request.rate}</span></td>
            <td><span>${request.cost}</span></td>
            <td><span>{request.hours}</span></td>
          </tr>
        )
      views.push(view);
    })
    return views;
  }
  
  reportsList = () => {
    let views = [];
    this.state.daysList.forEach((item, index) => {
      let header = (
        <tr key={index} className="date">
          <td><span>{item.date}</span></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td><span>{item.hours}</span></td>
        </tr>
      );
      views.push(header);
      
      let footer = (
          this.requestsList(item.requests)
        );
      views.push(footer);
    })
    return views;
  }
  
  reportNotFound = () => {
    return (
      <tr className="tl-item">
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td><span>Report not found</span></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    )
  }

  componentDidMount(){
    let month = {
      name: moment().format('MMMM'),
      value: parseInt(moment().format('MM'))
    };
    this.setState({
      chosenDay: moment().format('D'),
      chosenMonth: month,
      chosenYear: parseInt(moment().format('YYYY')),
      currentYear: parseInt(moment().format('YYYY')),
    });
    this.getCompaniesList();
  }
  
  getCompaniesList = () => {
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
        if(Array.isArray(res) && res.length > 0){
          let obj = {};
          let i = 0;
          res.forEach((company, index) => {
            let temp = {
              id: company.id,
              status: false,
            };
            obj[company.title] = temp;
            if(i < Object.keys(res).length -1 ){
              i++;
            }
            else{
              let array = new Array();
              array.push(obj);
              this.setState({
                optionTenants: array,
                companiesList: res,
              });
            }
          })
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  getReport = () => {
    let string = '';
    let temp = this.state.optionTenants[0];
    let  i = 0;
    let count = 0;
    for(let key in temp){
      if(temp[key].status == true){
        if(count == 0){
          string = string + temp[key].id;
        }
        else{
          string = string + ',' + temp[key].id;
        }
        count ++;
      }
      if(i == Object.keys(temp).length -1){
        if(count > 0){
          this.reportAPI(string);
        }
        else{
          return;
        }
      }
      else{
        i++;
      }
    }
  }
  
  reportAPI = (list) => {
    let params = {};
    if(this.state.optionAllSchedules == true){
      params = {
        all_request: this.state.optionAllSchedules,
        include_deleted: this.state.optionDeletedSchedules,
      };
    }
    else{
      params = {
        all_request: this.state.optionAllSchedules
      }
    }
    let temp = encodeURIComponent(list);
    const esc = encodeURIComponent
    const query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&')
    const requestUrl = config.serverUrl + config.api.reports + '/' + this.state.chosenYear + '/' + this.state.chosenMonth.value + '/web?' + 'companyids=' + temp + '&' + query;
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
        if(status == 200){
        if(Object.keys(res).length > 0){
          this.setState({
            totalsHour: res.hours,
            totalsCost: res.cost,
            daysList: res.days
          });
        }
        else{
          this.setState({
            totalsHour: 0,
            totalsCost: 0,
            daysList: []
          });
        }
      }
        else{
          this.setState({
            totalsHour: 0,
            totalsCost: 0,
            daysList: []
          });
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
   
    link.download= 'ahac_report_' + this.state.chosenYear + '-' + this.state.chosenMonth.value + '.csv';
    
    link.click();
    setTimeout(function(){
      // For Firefox it is necessary to delay revoking the ObjectURL
      window.URL.revokeObjectURL(data); }
    , 100);
  }
  
  downloadReport = (type) => {
    let string = '';
    let temp = this.state.optionTenants[0];
    let  i = 0;
    let count = 0;
    for(let key in temp){
      if(temp[key].status == true){
        if(count == 0){
          string = string + temp[key].id;
        }
        else{
          string = string + ',' + temp[key].id;
        }
        count ++;
      }
      if(i == Object.keys(temp).length -1){
        if(count > 0){
          if(type == 'CSV') {
            this.downloadCSV(string);
          }
          else {
            this.downloadPDF(string);
          }
        }
        else{
          return;
        }
      }
      else{
        i++;
      }
    }
    
  }
  
  downloadCSV = (list) => {
    const params = {
      all_request: true,
      include_deleted: false,
    };
    let temp = encodeURIComponent(list);
    const esc = encodeURIComponent
    const query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&')
    const requestUrl = config.serverUrl + config.api.reports + '/' + this.state.chosenYear + '/' + this.state.chosenMonth.value + '/csv?' + 'companyids=' + temp + '&' + query;
    
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
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
  
  downloadPDF = (list) => {
    const params = {
      all_request: true,
      include_deleted: false,
    };
    let temp = encodeURIComponent(list);
    const esc = encodeURIComponent
    const query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&')
    
    const requestUrl = config.serverUrl + config.api.reports + '/' + this.state.chosenYear + '/' + this.state.chosenMonth.value + '/pdf?' + 'companyids=' + temp + '&' + query;
    
    
    let status;
    fetch(requestUrl, {
      method: 'GET',
      headers: {
        "Authorization": sessionStorage.getItem('token')
      },
    })
      .then(response => {
        return response.json();
      })
      .then((res) => {
        let url = res.download_link;
        let link = document.createElement('a');
        link.download= 'ahac_report_' + this.state.chosenYear + '-' + this.state.chosenMonth.value + '.pdf';
        link.href = url;
        link.click();
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  render() {
    return (
      <div className="report">
        <Navigation {...this.props} />
        <div className="time-dropdown container">
          <div className="month">
            <Dropdown id="levels-dropdown">
              <Dropdown.Toggle noCaret>
                <table>
                  <tbody>
                    <tr>
                      <td><span className="level">{this.state.chosenMonth.name}</span></td>
                      <td><span className="pull-right"><img src="./down-arrow-ico-2.svg" alt="down arrow"/></span></td>
                    </tr>
                  </tbody>
                </table>
              </Dropdown.Toggle>
              <Dropdown.Menu className="super-colors">
                <MenuItem eventKey={{name: 'January', id: '1',parent:'month_dropdown'}} onSelect={this.select}>January</MenuItem>
                <MenuItem eventKey={{name: 'February', id: '2',parent:'month_dropdown'}} onSelect={this.select}>February</MenuItem>
                <MenuItem eventKey={{name: 'March', id: '3',parent:'month_dropdown'}} onSelect={this.select}>March</MenuItem>
                <MenuItem eventKey={{name: 'April', id: '4',parent:'month_dropdown'}} onSelect={this.select}>April</MenuItem>
                <MenuItem eventKey={{name: 'May', id: '5',parent:'month_dropdown'}} onSelect={this.select}>May</MenuItem>
                <MenuItem eventKey={{name: 'June', id: '6',parent:'month_dropdown'}} onSelect={this.select}>June</MenuItem>
                <MenuItem eventKey={{name: 'July', id: '7',parent:'month_dropdown'}} onSelect={this.select}>July</MenuItem>
                <MenuItem eventKey={{name: 'August', id: '8',parent:'month_dropdown'}} onSelect={this.select}>August</MenuItem>
                <MenuItem eventKey={{name: 'September', id: '9',parent:'month_dropdown'}} onSelect={this.select}>September</MenuItem>
                <MenuItem eventKey={{name: 'October', id: '10',parent:'month_dropdown'}} onSelect={this.select}>October</MenuItem>
                <MenuItem eventKey={{name: 'November', id: '11',parent:'month_dropdown'}} onSelect={this.select}>November</MenuItem>
                <MenuItem eventKey={{name: 'December', id: '12',parent:'month_dropdown'}} onSelect={this.select}>December</MenuItem>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div className="year">
            <Dropdown id="levels-dropdown">
              <Dropdown.Toggle noCaret>
                <table>
                  <tbody>
                    <tr>
                      <td><span className="level">{this.state.chosenYear}</span></td>
                      <td><span className="pull-right"><img src="./down-arrow-ico-2.svg" alt="down arrow"/></span></td>
                    </tr>
                  </tbody>
                </table>
              </Dropdown.Toggle>
              <Dropdown.Menu className="super-colors">
                <MenuItem eventKey={{name: this.state.currentYear, id: '1',parent:'year_dropdown'}} onSelect={this.select}>{this.state.currentYear}</MenuItem>
                <MenuItem eventKey={{name: (this.state.currentYear -1), id: '2',parent:'year_dropdown'}} onSelect={this.select}>{this.state.currentYear -1}</MenuItem>
                <MenuItem eventKey={{name: (this.state.currentYear -2), id: '2',parent:'year_dropdown'}} onSelect={this.select}>{this.state.currentYear -2}</MenuItem>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        <div className="tenant container">
          <div className="t-pseudo">
            <div className="row options">
              <div className="col-sm-5">
                <div className="option-item">
                  <span>Show Uncommitted Schedules</span>
                  <div className={this.state.optionAllSchedules ? 'check-item active' : 'check-item'}>
                    <div className="pseudo" onClick={this.toggleOption.bind(this, null, 'AllSchedules')}>
                      <img src="./checked-ico.svg" alt="check box"/>
                    </div>
                  </div>
                </div>
              </div>
              <div hidden={this.state.optionAllSchedules == false} className="col-sm-5">
                <div className="option-item">
                  <span>Include Deleted Schedules</span>
                  <div className={this.state.optionDeletedSchedules ? 'check-item active' : 'check-item'}>
                    <div className="pseudo" onClick={this.toggleOption.bind(this, null, 'DeletedSchedules')}>
                      <img src="./checked-ico.svg" alt="check box"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-7">
                <div className={this.state.showTenantDropdown ? 'multiselect-dropdown open' : 'multiselect-dropdown'}>
                  <button type="button" className="btn btn-default btn-tenant-dropdown dd-toggle" onClick={this.toggleDropdown}>
                    <span>Tenant</span>
                    <p>{this.state.companiesString}</p>
                  </button>
                  <ul className="dd-menu" onMouseLeave={this.outsideDropdown} onMouseEnter={this.insideDropdown}>
                    {
                      this.state.companiesList ? this.state.companiesList.map((company, index) => {
                        return (
                          <li key={index} className="m-item">
                            <span>{company.title}</span>
                            <div className={this.state.optionTenants[0][company.title].status ? 'check-item active' : 'check-item'}>
                              <div className="pseudo" onClick={this.toggleOption.bind(this, 'Tenants', company.title)}>
                                <img src="./checked-ico.svg" alt="check box"/>
                              </div>
                            </div>
                          </li>
                        );
                      }) : []
                    }
                  </ul>
                </div>
              </div>
              <div className="col-sm-5">
                <div className="totals">
                  <div className="row">
                    <div className="col-xs-6">
                      <div className="total-hours">
                        <div className="header">
                          <img src="./add-clock-ico.svg" alt="clock icon"/>
                          <span>Total Hours</span>
                        </div>
                        <div className="body">
                          <span>{this.state.totalsHour}</span><span className="unit"> hours</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-xs-6">
                      <div className="total-cost">
                        <div className="header">
                          <img src="./cost-ico.svg" alt="clock icon"/>
                          <span>Total Cost</span>
                        </div>
                        <div className="body">
                          <span className="unit">$ </span><span>{parseFloat(Math.round(this.state.totalsCost * 100) / 100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="analytic container">
          <div className="pseudo">
            <div className="row">
              <div className="col-md-6 col-md-offset-6">
                <div className="actions">
                  <div className="row">
                    <div className="col-sm-4 col-sm-offset-2">
                      <button className="btn btn-default btn-custom btn-download-csv" onClick={e => {
                        e.preventDefault();
                        this.downloadReport('CSV');
                      }}>
                        <table>
                          <tbody>
                            <tr>
                              <td className="text-left"><span>Download as CSV</span></td>
                              <td className="text-right"><img src="./download-ico.svg" alt="download csv icon"/></td>
                            </tr>
                          </tbody>
                        </table>
                      </button>
                    </div>
                    <div className="col-sm-3">
                      <button className="btn btn-default btn-custom btn-invoice" onClick={e => {
                        e.preventDefault();
                        this.downloadReport('PDF');
                      }}>
                        <table>
                          <tbody>
                            <tr>
                              <td className="text-left"><span>Invoice</span></td>
                              <td className="text-right"><img src="./page-ico.svg" alt="invoice icon"/></td>
                            </tr>
                          </tbody>
                        </table>
                      </button>
                    </div>
                    <div className="col-sm-3">
                      <button className="btn btn-default btn-custom btn-print" onClick={e => {
                        e.preventDefault();
                        window.print();
                      }}>
                        <table>
                          <tbody>
                            <tr>
                              <td className="text-left"><span>Print</span></td>
                              <td className="text-right"><img src="./printer-ico.svg" alt="printer icon"/></td>
                            </tr>
                          </tbody>
                        </table>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tenant-list">
              <table>
                <tbody>
                  <tr className="header">
                    <td>
                      <img src="./user-ico-2.svg" alt="tenant icon"/>
                      <span>Tenant</span>
                    </td>
                    <td>
                      <img src="./user-ico-2.svg" alt="user icon"/>
                      <span>User</span>
                    </td>
                    <td>
                      <img src="./clock-ico.svg" alt="clock icon"/>
                      <span>Request time</span>
                    </td>
                    <td>
                      <img src="./location-ico.svg" alt="purpose icon"/>
                      <span>Purpose</span>
                    </td>
                    <td>
                      <img src="./start-time-ico.svg" alt="start time icon"/>
                      <span>Start time</span>
                    </td>
                    <td>
                      <img src="./end-time-ico.svg" alt="user icon"/>
                      <span>End time</span>
                    </td>
                    <td>
                      <img src="./building-ico-2.svg" alt="level icon"/>
                      <span>Level</span>
                    </td>
                    <td>
                      <img src="./zone-ico.svg" alt="zone icon"/>
                      <span>Zone</span>
                    </td>
                    <td>
                      <img src="./cost-ico.svg" alt="rate icon"/>
                      <span>Rate</span>
                    </td>
                    <td>
                      <img src="./cost-ico.svg" alt="cost icon"/>
                      <span>Cost</span>
                    </td>
                    <td>
                      <img src="./alarm-clock-ico.svg" alt="clock icon"/>
                      <span>Hours</span>
                    </td>
                  </tr>
                  {this.state.daysList.length > 0 ? this.reportsList() : this.reportNotFound()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <Footer {...this.props} />
      </div>
    );
  }
}