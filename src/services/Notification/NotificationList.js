import './NotificationList.css';

import React, { useEffect, useState } from 'react';
import useFetch from 'use-http';
import { Avatar, Button, Card, Space, Table, Tag, Typography } from 'antd';
import { Link, useHistory } from "react-router-dom";
import { NotificationOutlined } from '@ant-design/icons';
import { formatRelativeTime, truncateString } from '../../utils';




const NotificationList = (props) => {
  const [page, setPage] = useState({
    current: 1,
    pageSize: 10,
  });
  const [tableData, setTableData] = useState([]);

  const { get, post, response, loading } = useFetch();

  const markAsRead = (id) => () => {
    post(`/api/v1/notifications/${id}/mark_read/`).then(data => {
      if (response.ok) {
        window.location.reload(false);
      }
      console.error(data);
    });
  };

  const columns = [
    {
      title: <NotificationOutlined/>,
      render: (text, record) => {
        const notification = `[Review] ${record.reviewer.contact.email} submitted review in ${record.audit.title}`
        return (
          <Space direction="vertical">
            <Typography.Text strong={!record.read_at}>{notification}</Typography.Text>
            <Typography.Text>{formatRelativeTime(record.created_at)}</Typography.Text>
          </Space>
        )
      }
    },
    {
      title: '',
      render: (text, record) => {
        return (
          !record.read_at && <Button type="link" onClick={markAsRead(record.id)}>Mark as Read</Button>
        )
      }
    },
  {
    title: '',
      render: (text, record) => {
        return (
          <Button type="link"><Link to={`/audits/${record.audit.id}/`}>Open</Link></Button>
        )
      }
  }
  ];

  const fetchList = (page) => {
    get(`/api/v1/notifications/?page=${page}`).then(data => {
      if (response.ok) {
        console.log(data);
        const newData = data.results.map(notification => ({ ...notification, key: notification.id }));
        setPage({
          ...page,
          total: data.count
        })
        return setTableData(newData);
      }
      console.error(data);
    });
  }

  useEffect(() => {
    fetchList(1);
  }, [])


  const onChange = (nextPage) => {
    console.log(nextPage);
    fetchList(nextPage.current);
  };

  return (
    <div>
      <Card title="Notifications">
        <Table
          loading={loading}
          columns={columns}
          dataSource={tableData}
          pagination={page}
          onChange={onChange}
        />
      </Card>
    </div>
  );
};

export default NotificationList;