import './index.css';
import { Link } from "react-router-dom";
import { Card, Typography } from 'antd';
import Banner from "./Banner";
import AuditList from "./AuditList";

const { Text } = Typography;

const Dashboard = ({ ...props }) => {
  return (
    <div>
      <Card title="Dashboard">
        <Banner />
        <div className="dash-content">
          <AuditList />
        </div>
      </Card>
    </div>
  )
};


export default Dashboard;
