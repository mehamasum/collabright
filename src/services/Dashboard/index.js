import './index.css';
import {Link} from "react-router-dom";
import IntegrationsTab from './IntegrationsTab';

const Dashboard = ({...props}) => {
  return (
    <div>
      Dashboard

      <IntegrationsTab/>
    </div>
  )
};


export default Dashboard;
