import './AuditList.css';

import React, {useEffect, useState} from 'react';
import useFetch from 'use-http';
import {Avatar, Button, Card, Space, Table, Tag, Typography} from 'antd';
import {Link, useHistory} from "react-router-dom";
import {LinkOutlined} from '@ant-design/icons';
import {formatRelativeTime, truncateString} from '../../utils';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const columns = [
  {
    title: 'Title',
    dataIndex: 'title',
    render: (text, record) => (
      <Space direction="vertical">
        <div><Tag size="small" color={record.is_open ? 'success' : 'purple'}>{record.is_open ? 'Open' : 'Closed'}</Tag><Typography.Text><Link to={`/audits/${record.id}`}>{truncateString(record.title, 120)}</Link></Typography.Text></div>
      </Space>
    )
  }
];

const PostListView = (props) => {
  const [page, setPage] = useState({
    current: 1,
    pageSize: 10,
  });
  const [tableData, setTableData] = useState([]);

  const { get, response, loading } = useFetch();

  const fetchList = (page) => {
    get(`/api/v1/audits/?page=${page}`).then(data => {
      if (response.ok) {
        console.log(data);
        const newData = data.results.slice(0, 5).map(audit => ({ ...audit, key: audit.id}));
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
      <Card title="Recent Activity">
        <Table
          showHeader={false}
          size="small"
          loading={loading}
          columns={columns}
          dataSource={tableData}
          pagination={{ position: ['none', 'none'] }}
          onChange={onChange}
        />
      </Card>
    </div>
  );
};

export default PostListView;