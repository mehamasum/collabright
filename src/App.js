import 'antd/dist/antd.css';
import './App.css';
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom';
import Dashboard from './services/Dashboard';
import {Login} from './services/Auth';
import ReviewerView from './services/SharedViews/ReviewerView';
import { Result } from 'antd';
import { Provider as FetchProvider } from 'use-http';
import { useLocalStorage } from '@rehooks/local-storage';

import PrivateRoute from './routes/PrivateRoute';

const App = (props) => {
  const [token] = useLocalStorage('token');

  return (
    <FetchProvider url={process.env.REACT_APP_API_URL} options={
      {
        headers: {
          'Authorization': token ? `Token ${token}` : undefined,
          'Content-Type': 'application/json'
        }
      }
    }>
      <Router>
        <Switch>
          <Route exact path="/login">
            <Login/>
          </Route>
          <Route exact path="/review/:id/:token">
            <ReviewerView/>
          </Route>
          <PrivateRoute exact path="/" component={Dashboard} />
          <Route render={() => <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />} />
        </Switch>
      </Router>
    </FetchProvider>
  );
};

export default App;
