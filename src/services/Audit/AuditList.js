import './AuditList.css';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import useFetch from 'use-http';
import {Avatar, Button, Card, Space, Table, Tooltip, Typography} from 'antd';
import {Link, useHistory} from "react-router-dom";
import {LinkOutlined,} from '@ant-design/icons';
import {formatRelativeTime, truncateString} from '../../utils';


const columns = [
  {
    title: 'Status',
    dataIndex: 'status',
    width: '30%',
    render: (text, record) => (
      <Typography.Text>{truncateString(record.status, 120)}</Typography.Text>
    )
  },
  {
    title: 'Page',
    render: (text, record) => (
      <Tooltip title={record.page_name}>
        <Avatar
          src={`https://graph.facebook.com/${record.facebook_page_id}/picture`}
          size="small"
        />
      </Tooltip>
    )
  },
  {
    title: 'Publish Time',
    dataIndex: 'created_at',
    render: (text, record) => (
      <Typography.Text>{formatRelativeTime(record.created_at)}</Typography.Text>
    )
  },
  {
    title: 'Linked Sign Up',
    render: (text, record) => (
      <Space>
        {record.signup ? <Link to={`/signups/${record.signup}/`}>View</Link> : '--'}
      </Space>
    ),
  },
  {
    title: 'Published Post',
    render: (text, record) => (
      <Space size="middle">
        <a target="_blank" rel="noopener noreferrer"
           href={`https://facebook.com/${record.facebook_page_id}/posts/${record.facebook_post_id}`}><LinkOutlined/> Open</a>
      </Space>
    ),
  },
  {
    title: 'Actions',
    render: (text, record) => (
      <Space size="middle">
        <Link to={`/posts/${record.id}`}>Details</Link>
      </Space>
    ),
  },
];

const PostListView = (props) => {
  const fetchUrl = props.fetchUrl || '/api/audits/?limit=25&offset=';
  const [posts_response, , setUrl] = useFetch(`${fetchUrl}0`);
  const [pagination, setPagination] = useState({current: 1, pageSize: 25, showSizeChanger: false});
  const [total, setTotal] = useState(0);

  const tableData = useMemo(() => {
    if (!posts_response) return [];
    //return posts_response.results.map(r => ({...r, key: r.id}));
  }, [posts_response]);

  const onChangeTable = useCallback((pag) => {
    setPagination(pag);
    const offset = (pag.current - 1) * 25;
    setUrl(`${fetchUrl}${offset}`);
  }, [fetchUrl, setPagination, setUrl]);

  useEffect(() => {
    if (!posts_response) return;
    setTotal(posts_response.count);
  }, [posts_response]);

  return (
    <div>
      <Card title="Audits" extra={
        <Button type="primary"><Link to={`/audits/new`}>Create New Audit</Link></Button>
      }>
        <Table columns={columns} dataSource={tableData} pagination={{...pagination, total}}
               onChange={onChangeTable}/>
      </Card>
    </div>
  );
};

export default PostListView;