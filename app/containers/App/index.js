/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import { HashRouter as Router, Switch, Route, Link,
  Redirect,
  withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import SignIn from 'containers/SignIn';
import FloorMap from 'containers/FloorMap';
import FloorPlan from 'containers/FloorPlan';
import Settings from 'containers/Settings';
import ZoneMapping from 'containers/ZoneMapping';
import GlobalSettings from 'containers/GlobalSettings';
import AdminUsers from 'containers/AdminUsers';
import BackupRestore from 'containers/BackupRestore';
import DeviceConfiguration from 'containers/DeviceConfiguration';
import Report from 'containers/Report';
import NotFoundPage from 'containers/NotFoundPage/Loadable';
import PrivateRoute from "components/PrivateRoute";
import ForgotPassword from 'containers/ForgotPassword';
import ResetPassword from 'containers/ResetPassword';
import UserProfile from "containers/UserProfile";
import Navigation from "components/Navigation";
import Draw from 'containers/Draw';
import BACnet from 'containers/BACnet';

const getPath = () => {
  let path = window.location.pathname;
  const sizefilename = path.length - (path.lastIndexOf('/') + 1);
  path = path.substr(path, path.length - sizefilename);
  return path;
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={SignIn} />
        <Route path="/sign-in" component={SignIn} />
        <PrivateRoute path="/navigation" component={Navigation} />
        <PrivateRoute path="/floor-map" component={FloorMap} />
        <PrivateRoute path="/floor-plan" component={FloorPlan} />
        <PrivateRoute path="/settings" component={Settings} />
        <PrivateRoute path="/zone-mapping" component={ZoneMapping} />
        <PrivateRoute path="/global-settings" component={GlobalSettings} />
        <PrivateRoute path="/admin-settings" component={AdminUsers} />
        <PrivateRoute path="/backup-restore" component={BackupRestore} />
        <PrivateRoute path="/device-configuration" component={DeviceConfiguration} />
        <PrivateRoute path="/BACnet" component={BACnet} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <PrivateRoute path="/profile" component={UserProfile} />
        <PrivateRoute path="/report" component={Report} />
        <PrivateRoute path="/draw" component={Draw} />
        <Route path="" component={NotFoundPage} />
      </Switch>
    </Router>
  );
}

