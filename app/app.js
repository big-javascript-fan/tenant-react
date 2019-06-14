/**
 * app.js
 *
 * This is the entry file for the application, only setup and boilerplate
 * code.
 */

// Needed for redux-saga es6 generator support
import 'babel-polyfill';

// Import all the third party stuff
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import FontFaceObserver from 'fontfaceobserver';
import createHistory from 'history/createBrowserHistory';
import 'sanitize.css/sanitize.css';

// Import root app
import App from 'containers/App';

// Import Language Provider
import LanguageProvider from 'containers/LanguageProvider';

// Load the favicon, the manifest.json file and the .htaccess file
/* eslint-disable import/no-webpack-loader-syntax */
import '!file-loader?name=[name].[ext]!./manifest.json';
import 'file-loader?name=[name].[ext]!./.htaccess'; // eslint-disable-line import/extensions
/* eslint-enable import/no-webpack-loader-syntax */


// Import images
import '!file-loader?name=[name].[ext]!./images/white-logo.svg';
import '!file-loader?name=[name].[ext]!./images/color-logo.svg';
import '!file-loader?name=[name].[ext]!./images/grey-logo.svg';
import '!file-loader?name=[name].[ext]!./images/grey-right-arrow.svg';
import '!file-loader?name=[name].[ext]!./images/white-right-arrow.svg';
import '!file-loader?name=[name].[ext]!./images/zone-map.svg';
import '!file-loader?name=[name].[ext]!./images/black-left-arrow.svg';
import '!file-loader?name=[name].[ext]!./images/circle-calendar-ico.svg';
import '!file-loader?name=[name].[ext]!./images/checked-ico.svg';
import '!file-loader?name=[name].[ext]!./images/user-ico.svg';
import '!file-loader?name=[name].[ext]!./images/lock-ico.svg';
import '!file-loader?name=[name].[ext]!./images/eye-ico.svg';
import '!file-loader?name=[name].[ext]!./images/menu-ico.svg';
import '!file-loader?name=[name].[ext]!./images/air-cons-ico.svg';
import '!file-loader?name=[name].[ext]!./images/temperature-ico.svg';
import '!file-loader?name=[name].[ext]!./images/water-drop-ico.svg';
import '!file-loader?name=[name].[ext]!./images/co2-ico.svg';
import '!file-loader?name=[name].[ext]!./images/plus-ico.svg';
import '!file-loader?name=[name].[ext]!./images/minus-ico.svg';
import '!file-loader?name=[name].[ext]!./images/edit-ico.svg';
import '!file-loader?name=[name].[ext]!./images/remove-ico.svg';
import '!file-loader?name=[name].[ext]!./images/white-plus-ico.svg';
import '!file-loader?name=[name].[ext]!./images/down-arrow-ico.svg';
import '!file-loader?name=[name].[ext]!./images/close-ico.svg';
import '!file-loader?name=[name].[ext]!./images/calendar-ico.svg';
import '!file-loader?name=[name].[ext]!./images/color-calendar-ico.svg';
import '!file-loader?name=[name].[ext]!./images/forward-arrow-ico.svg';
import '!file-loader?name=[name].[ext]!./images/tenant-ico.svg';
import '!file-loader?name=[name].[ext]!./images/zone-mapping-ico.svg';
import '!file-loader?name=[name].[ext]!./images/setting-ico.svg';
import '!file-loader?name=[name].[ext]!./images/admin-setting-ico.svg';
import '!file-loader?name=[name].[ext]!./images/backup-restore-ico.svg';
import '!file-loader?name=[name].[ext]!./images/device-config-ico.svg';
import '!file-loader?name=[name].[ext]!./images/add-user-ico.svg';
import '!file-loader?name=[name].[ext]!./images/person-ico.svg';
import '!file-loader?name=[name].[ext]!./images/remove-person-ico.svg';
import '!file-loader?name=[name].[ext]!./images/grey-forward-arrow-ico.svg';
import '!file-loader?name=[name].[ext]!./images/white-lock-ico.svg';
import '!file-loader?name=[name].[ext]!./images/dark-grey-remove-person-ico.svg';
import '!file-loader?name=[name].[ext]!./images/plus-square-ico.svg';
import '!file-loader?name=[name].[ext]!./images/white-edit-ico.svg';
import '!file-loader?name=[name].[ext]!./images/white-remove-ico.svg';
import '!file-loader?name=[name].[ext]!./images/building-ico.svg';
import '!file-loader?name=[name].[ext]!./images/pencil-ruler-ico.svg';
import '!file-loader?name=[name].[ext]!./images/search-ico.svg';
import '!file-loader?name=[name].[ext]!./images/sync-ico.svg';
import '!file-loader?name=[name].[ext]!./images/document-ico.svg';
import '!file-loader?name=[name].[ext]!./images/read-ico.svg';
import '!file-loader?name=[name].[ext]!./images/write-ico.svg';
import '!file-loader?name=[name].[ext]!./images/active-tenant-ico.svg';
import '!file-loader?name=[name].[ext]!./images/active-zone-mapping-ico.svg';
import '!file-loader?name=[name].[ext]!./images/active-setting-ico.svg';
import '!file-loader?name=[name].[ext]!./images/building-ico-2.svg';
import '!file-loader?name=[name].[ext]!./images/city-ico.svg';
import '!file-loader?name=[name].[ext]!./images/direction-sign-ico.svg';
import '!file-loader?name=[name].[ext]!./images/bank-ico.svg';
import '!file-loader?name=[name].[ext]!./images/notes-ico.svg';
import '!file-loader?name=[name].[ext]!./images/calendar-ico-2.svg';
import '!file-loader?name=[name].[ext]!./images/clock-ico.svg';
import '!file-loader?name=[name].[ext]!./images/trash-ico.svg';
import '!file-loader?name=[name].[ext]!./images/color-picker-ico.svg';
import '!file-loader?name=[name].[ext]!./images/attachment-ico.svg';
import '!file-loader?name=[name].[ext]!./images/active-admin-setting-ico.svg';
import '!file-loader?name=[name].[ext]!./images/user-ico-2.svg';
import '!file-loader?name=[name].[ext]!./images/email-ico.svg';
import '!file-loader?name=[name].[ext]!./images/id-card-ico.svg';
import '!file-loader?name=[name].[ext]!./images/address-ico.svg';
import '!file-loader?name=[name].[ext]!./images/circle-trash-ico.svg';
import '!file-loader?name=[name].[ext]!./images/circle-edit-ico.svg';
import '!file-loader?name=[name].[ext]!./images/active-backup-restore-ico.svg';
import '!file-loader?name=[name].[ext]!./images/active-device-config-ico.svg';
import '!file-loader?name=[name].[ext]!./images/wifi-modem-ico.svg';
import '!file-loader?name=[name].[ext]!./images/white-forward-arrow-ico.svg';
import '!file-loader?name=[name].[ext]!./images/add-clock-ico.svg';
import '!file-loader?name=[name].[ext]!./images/cost-ico.svg';
import '!file-loader?name=[name].[ext]!./images/location-ico.svg';
import '!file-loader?name=[name].[ext]!./images/start-time-ico.svg';
import '!file-loader?name=[name].[ext]!./images/end-time-ico.svg';
import '!file-loader?name=[name].[ext]!./images/zone-ico.svg';
import '!file-loader?name=[name].[ext]!./images/alarm-clock-ico.svg';
import '!file-loader?name=[name].[ext]!./images/printer-ico.svg';
import '!file-loader?name=[name].[ext]!./images/page-ico.svg';
import '!file-loader?name=[name].[ext]!./images/download-ico.svg';
import '!file-loader?name=[name].[ext]!./images/down-arrow-ico-2.svg';

import '!file-loader?name=[name].[ext]!./images/login-bg.png';
import '!file-loader?name=[name].[ext]!./images/favicon.png';
import '!file-loader?name=[name].[ext]!./images/avatar.png';
import '!file-loader?name=[name].[ext]!./images/location-image.png';
import '!file-loader?name=[name].[ext]!./images/floor-item-bg.png';
import '!file-loader?name=[name].[ext]!./images/lg-environment-bg.png';
import '!file-loader?name=[name].[ext]!./images/md-environment-bg.png';
import '!file-loader?name=[name].[ext]!./images/sm-environment-bg.png';
import '!file-loader?name=[name].[ext]!./images/tenant-item-bg.png';
import '!file-loader?name=[name].[ext]!./images/user-photo.png';
import '!file-loader?name=[name].[ext]!./images/tenant-photo.png';
import '!file-loader?name=[name].[ext]!./images/user-tenant-avatar.png';
import '!file-loader?name=[name].[ext]!./images/choose-file.png';
import '!file-loader?name=[name].[ext]!./images/btn-edit-profile.png';
import '!file-loader?name=[name].[ext]!./images/btn-delete.png';
import '!file-loader?name=[name].[ext]!./images/btn-edit-profile-2.png';
import '!file-loader?name=[name].[ext]!./images/btn-delete-2.png';

import '!file-loader?name=[name].[ext]!./images/tenants/fanta.png';
import '!file-loader?name=[name].[ext]!./images/tenants/shell.png';
import '!file-loader?name=[name].[ext]!./images/tenants/hsbc.png';
import '!file-loader?name=[name].[ext]!./images/tenants/playstation.png';
import '!file-loader?name=[name].[ext]!./images/tenants/altmetric.png';
import '!file-loader?name=[name].[ext]!./images/tenants/7eleven.png';
import '!file-loader?name=[name].[ext]!./images/tenants/commonwealth-bank.png';
import '!file-loader?name=[name].[ext]!./images/envelope-3.svg';
import '!file-loader?name=[name].[ext]!./images/design-pencil-ruler-grid-guide.svg';
import '!file-loader?name=[name].[ext]!./images/global-image-box.png';
import '!file-loader?name=[name].[ext]!./images/global-icon-delete.png';
import '!file-loader?name=[name].[ext]!./images/btn-edit-user-profile.png';
import '!file-loader?name=[name].[ext]!./images/floor_plan.png';
import '!file-loader?name=[name].[ext]!./images/active-BACnet-ico.svg';
import '!file-loader?name=[name].[ext]!./images/BACnet-ico.svg';
import '!file-loader?name=[name].[ext]!./images/on-status.png';
import '!file-loader?name=[name].[ext]!./images/off-status.png';
import '!file-loader?name=[name].[ext]!./images/arrow-ico.png';
import '!file-loader?name=[name].[ext]!./images/arrow-ico-drop-up.png';
import '!file-loader?name=[name].[ext]!./images/check-ico-1.png';
import '!file-loader?name=[name].[ext]!./images/check-ico-2.png';
// Import css
import '!style-loader!css-loader!sass-loader!./css/bootstrap/css/bootstrap.min.css';
import '!style-loader!css-loader!sass-loader!./css/font-awesome/css/font-awesome.min.css';
import '!style-loader!css-loader!sass-loader!./css/slick-carousel/slick.css';
import '!style-loader!css-loader!sass-loader!./css/slick-carousel/slick-theme.css';
import '!style-loader!css-loader!sass-loader!./css/style.scss';

import configureStore from './configureStore';

// Import i18n messages
import { translationMessages } from './i18n';

// Import CSS reset and Global Styles
// import './global-styles';

// Observe loading of Open Sans (to remove open sans, remove the <link> tag in
// the index.html file and this observer)
const openSansObserver = new FontFaceObserver('Open Sans', {});

// When Open Sans is loaded, add a font-family using Open Sans to the body
openSansObserver.load().then(() => {
  document.body.classList.add('fontLoaded');
}, () => {
  document.body.classList.remove('fontLoaded');
});

// Create redux store with history
const initialState = {};
const history = createHistory();
const store = configureStore(initialState, history);
const MOUNT_NODE = document.getElementById('app');

const render = (messages) => {
  ReactDOM.render(
    <Provider store={store}>
      <LanguageProvider messages={messages}>
        <ConnectedRouter history={history}>
          <App />
        </ConnectedRouter>
      </LanguageProvider>
    </Provider>,
    MOUNT_NODE
  );
};

if (module.hot) {
  // Hot reloadable React components and translation json files
  // modules.hot.accept does not accept dynamic dependencies,
  // have to be constants at compile-time
  module.hot.accept(['./i18n', 'containers/App'], () => {
    ReactDOM.unmountComponentAtNode(MOUNT_NODE);
    render(translationMessages);
  });
}

// Chunked polyfill for browsers without Intl support
if (!window.Intl) {
  (new Promise((resolve) => {
    resolve(import('intl'));
  }))
    .then(() => Promise.all([
      import('intl/locale-data/jsonp/en.js'),
      import('intl/locale-data/jsonp/de.js'),
    ]))
    .then(() => render(translationMessages))
    .catch((err) => {
      throw err;
    });
} else {
  render(translationMessages);
}

// Install ServiceWorker and AppCache in the end since
// it's not most important operation and if main code fails,
// we do not want it installed
if (process.env.NODE_ENV === 'production') {
  require('offline-plugin/runtime').install(); // eslint-disable-line global-require
}
