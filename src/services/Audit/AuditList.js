import './AuditList.css';

import React, {useEffect, useState} from 'react';
import useFetch from 'use-http';
import {Avatar, Button, Card, Space, Table, Tag, Typography} from 'antd';
import {Link, useHistory} from "react-router-dom";
import {LinkOutlined} from '@ant-design/icons';
import {formatRelativeTime, truncateString} from '../../utils';


const columns = [
  {
    title: 'Title',
    dataIndex: 'title',
    render: (text, record) => (
      <Typography.Text>{truncateString(record.title, 24)}</Typography.Text>
    )
  },
  {
    title: 'Description',
    dataIndex: 'description',
    render: (text, record) => (
      <Typography.Text>{record.description ? truncateString(record.description, 48) : 'N/A'}</Typography.Text>
    )
  },
  {
    title: 'Map',
    render: (text, record) => (
      <Space size="middle">
        <a target="_blank" rel="noopener noreferrer" href={record.map_url}><LinkOutlined/> Link</a>
      </Space>
    ),
  },
  {
    title: 'Created at',
    dataIndex: 'created_at',
    render: (text, record) => (
      <Typography.Text>{formatRelativeTime(record.created_at)}</Typography.Text>
    )
  },
  {
    title: 'Status',
    dataIndex: 'is_open',
    render: (text, record) => (
      <Tag color={record.is_open ? 'success' : 'purple'}>{record.is_open ? 'Open' : 'Closed'}</Tag>
    )
  },
  {
    title: 'Actions',
    render: (text, record) => (
      <Space size="middle">
        <Link to={`/audits/${record.id}`}>Details</Link>
      </Space>
    ),
  },
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
        const newData = data.results.map(audit => ({ ...audit, key: audit.id}));
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
      <Card title="Audits" extra={
        <Button type="primary"><Link to={`/audits/new`}>Create New Audit</Link></Button>
      }>
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

export default PostListView;