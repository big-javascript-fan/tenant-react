import React from 'react';

export default class SettingControl extends React.Component {
  goToTenantsAndUser = () => {
    this.props.history.push({pathname: '/settings', state: {key: 'Settings', activeTab: '2', activeSettingTab: '1'}});
  }

  goToZoneMapping = () => {
    this.props.history.push({pathname: '/zone-mapping', state: {key: 'Zone Mapping', activeTab: '2', activeSettingTab: '2'}});
  }

  goToDraw = () => {
    this.props.history.push({pathname: '/draw', state: {key: 'Draw', activeTab: '2', activeSettingTab:'3'}});
  }

  goToGlobalSettings = () => {
    this.props.history.push({pathname: '/global-settings', state: {key: 'Global Settings', activeTab: '2', activeSettingTab: '4'}});
  }

  goToAdminSettings = () => {
    this.props.history.push({pathname: '/admin-settings', state: {key: 'Admin Settings', activeTab: '2', activeSettingTab: '5'}});
  }

  goToBackupAndRestore = () => {
    this.props.history.push({pathname: '/backup-restore', state: {key: 'Backup and Restore', activeTab: '2', activeSettingTab: '6'}});
  }

  goToDeviceConfiguration = () => {
    this.props.history.push({pathname: '/device-configuration', state: {key: 'Device Configuration', activeTab: '2', activeSettingTab: '7'}});
  }
  
  goToBACnet = () => {
    this.props.history.push({pathname: '/BACnet', state: {key: 'BACnet', activeTab: '2', activeSettingTab: '8'}});
  }

  render() {
    let activeSettingTab = null;
    let role = sessionStorage.getItem('role');
    if(this.props.location.state) {
      if(this.props.location.state.activeSettingTab) {
        activeSettingTab = this.props.location.state.activeSettingTab;
      }
    } else {
      if(this.props.location.pathname) {
        let pathname = this.props.location.pathname.replace(/\/+/, '');
        switch (pathname) {
          case 'settings':
            activeSettingTab = '1';
            break;
          case 'zone-mapping':
            activeSettingTab = '2';
            break;
          case 'draw':
            activeSettingTab = '3';
            break;
          case 'global-settings':
            activeSettingTab = '4';
            break;
          case 'admin-settings':
            activeSettingTab = '5';
            break;
          case 'backup-restore':
            activeSettingTab = '6';
            break;
          case 'device-configuration':
            activeSettingTab = '7';
            break;
          case 'BACnet':
            activeSettingTab = '8';
            break;
        }
      }
    }

    return (
      <div className="setting-control container">
        <ul>
          <li className={activeSettingTab == '1' ? 'active' : ''}>
            <div className="sc-item" onClick={this.goToTenantsAndUser}>
              <img src={activeSettingTab == '1' ? './active-tenant-ico.svg' : './tenant-ico.svg'} alt="zone mapping"/><span>Tenants and Users</span>
            </div>
          </li>
          <li hidden={role != 'ROLE_ADMIN'} className={activeSettingTab == '2' ? 'active' : ''}>
            <div className="sc-item" onClick={this.goToZoneMapping}>
              <img src={activeSettingTab == '2' ? './active-zone-mapping-ico.svg' : './zone-mapping-ico.svg'} alt="zone mapping"/><span>Zone Mapping</span>
            </div>
          </li>
          <li hidden={role != 'ROLE_ADMIN'} className={activeSettingTab == '3' ? 'active' : ''}>
            <div className="sc-item" onClick={this.goToDraw}>
              <img src={activeSettingTab == '3' ? './active-zone-mapping-ico.svg' : './zone-mapping-ico.svg'} alt="zone mapping"/><span>Draw Floor Map</span>
            </div>
          </li>
          <li hidden={role != 'ROLE_ADMIN'} className={activeSettingTab == '4' ? 'active' : ''}>
            <div className="sc-item" onClick={this.goToGlobalSettings}>
              <img src={activeSettingTab == '4' ? './active-setting-ico.svg' : './setting-ico.svg'} alt="global setting"/><span>Global Settings</span>
            </div>
          </li>
          <li hidden={role != 'ROLE_ADMIN'} className={activeSettingTab == '5' ? 'active' : ''}>
            <div className="sc-item" onClick={this.goToAdminSettings}>
              <img src={activeSettingTab == '5' ? './active-admin-setting-ico.svg' : './admin-setting-ico.svg'} alt="admin setting"/><span>Admin Users</span>
            </div>
          </li>
          <li hidden={role != 'ROLE_ADMIN'} className={activeSettingTab == '6' ? 'active' : ''}>
            <div className="sc-item" onClick={this.goToBackupAndRestore}>
              <img src={activeSettingTab == '6' ? './active-backup-restore-ico.svg' : './backup-restore-ico.svg'} alt="backup and restore"/><span>Backup &amp; Restore</span>
            </div>
          </li>
          <li hidden={role != 'ROLE_ADMIN'} className={activeSettingTab == '7' ? 'active' : ''}>
            <div className="sc-item" onClick={this.goToDeviceConfiguration}>
              <img src={activeSettingTab == '7' ? './active-device-config-ico.svg' : './device-config-ico.svg'} alt="device config"/><span>Device Configuration</span>
            </div>
          </li>
          <li hidden={role != 'ROLE_ADMIN'} className={activeSettingTab == '8' ? 'active' : ''}>
            <div className="sc-item" onClick={this.goToBACnet}>
              <img src={activeSettingTab == '8' ? './active-BACnet-ico.svg' : './BACnet-ico.svg'} alt="BACnet"/><span>BACnet</span>
            </div>
          </li>
        </ul>
      </div>
    );
  }
}