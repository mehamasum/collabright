import 'antd/dist/antd.css';
import './App.css';
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './services/Dashboard';
import {Login} from './services/Auth';
import OAuthCallback from './services/Auth/OAuthCallback';
import ReviewerView from './services/SharedViews/ReviewerView';
import { Result } from 'antd';
import { Provider as FetchProvider } from 'use-http';
import { useLocalStorage } from '@rehooks/local-storage';
import AuditCreate from './services/Audit/AuditCreate';
import AuditList from './services/Audit/AuditList';
import AuditView from './services/Audit/AuditView';

import PrivateRoute from './routes/PrivateRoute';
import { setDefaultOptions } from 'esri-loader';

setDefaultOptions({ version: '3.37', css: true })

const App = (props) => {
  const [token] = useLocalStorage('token');

  return (
    <FetchProvider url={process.env.REACT_APP_API_URL} options={
      {
        headers: {
          'Authorization': token ? `Token ${token}` : undefined,
          'Content-Type': 'application/json'
        },
        cachePolicy: 'no-cache'
      }
    }>
      <Router>
        <Switch>
          <Route exact path="/login">
            <Login/>
          </Route>
          <Route exact path="/review/:audit/">
            <ReviewerView/>
          </Route>
          <PrivateRoute exact path="/" component={Dashboard} />
          <PrivateRoute exact path="/audits" component={AuditList} />
          <PrivateRoute exact path="/audits/new" component={AuditCreate} />
          <PrivateRoute exact path="/audits/:id" component={AuditView} />
          <PrivateRoute exact path="/oauth/callback/:integration/" component={OAuthCallback} withoutTemplate/>
          <Route render={() => <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />} />
        </Switch>
      </Router>
    </FetchProvider>
  );
};

export default App;
