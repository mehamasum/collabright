import 'antd/dist/antd.css';
import './App.css';
import { Helmet } from "react-helmet";
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './services/Dashboard';
import { Login } from './services/Auth';
import OAuthCallback from './services/Auth/OAuthCallback';
import ReviewerView from './services/Audit/ReviewerView';
import { Result } from 'antd';
import { Provider as FetchProvider } from 'use-http';
import { useLocalStorage } from '@rehooks/local-storage';
import AuditCreate from './services/Audit/AuditCreate';
import AuditList from './services/Audit/AuditList';
import AuditView from './services/Audit/AuditView';
import ContactList from './services/Contacts';

import PrivateRoute from './routes/PrivateRoute';
import { setDefaultOptions } from 'esri-loader';
import Settings from './services/Settings';
import NotificationList from './services/Notification/NotificationList';

setDefaultOptions({ version: '3.37', css: true })

const App = (props) => {
  const [token] = useLocalStorage('token');

  return (
    <FetchProvider options={
      {
        headers: {
          'Content-Type': 'application/json'
        },
        cachePolicy: 'no-cache'
      }
    }>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Collabright | A secure space to share maps and collaborate with others</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <Router>
        <Switch>
          <Route exact path="/login">
            <Login />
          </Route>
          <Route exact path="/review/:audit/:tab?">
            <ReviewerView />
          </Route>
          <PrivateRoute exact path="/contacts" component={ContactList} />
          <PrivateRoute exact path="/settings/:tab?" component={Settings} />
          <PrivateRoute exact path="/notifications" component={NotificationList} />
          <PrivateRoute exact path="/" component={Dashboard} />
          <PrivateRoute exact path="/audits" component={AuditList} />
          <PrivateRoute exact path="/audits/new" component={AuditCreate} />
          <PrivateRoute exact path="/audits/:id/:tab?" component={AuditView} />
          <PrivateRoute exact path="/oauth/callback/:integration/" component={OAuthCallback} withoutTemplate />
          <Route render={() => <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />} />
        </Switch>
      </Router>
    </FetchProvider>
  );
};

export default App;
