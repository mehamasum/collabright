import './ContactList.css';

import React, { useEffect, useState } from 'react';
import useFetch from 'use-http';
import { Button, Card, Space, Table, Modal, Typography, Form, Input, } from 'antd';
import { formatRelativeTime } from '../../utils';
import { EditOutlined, DeleteOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';


const ContactForm = ({ editingContact, onComplete }) => {
  const { post, patch, response, loading } = useFetch();
  const [errors, setErrors] = useState(null);

  const onFinish = values => {
    const method = editingContact ? patch : post;
    const url = editingContact ? `/api/v1/contacts/${editingContact.id}/` : '/api/v1/contacts/';
    method(url, values).then(data => {
      if (response.ok) {
        onComplete(data);
        return;
      }
      setErrors(data);
    });
  };

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Form
      name="contact"
      initialValues={editingContact}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            message: 'Please input your email!',
          },
        ]}
        help={errors?.email}
        validateStatus={errors?.email ? "error" : undefined}
      >
        <Input placeholder="Email" type="email" />
      </Form.Item>

      <Form.Item
        name="name"
        rules={[
          {
            required: true,
            message: 'Please input the Name!',
          },
        ]}
      >
        <Input placeholder="Name" />
      </Form.Item>
      <Form.Item >
        <Button type="primary" htmlType="submit" className="login-form-submit" loading={loading}>
          {editingContact ? 'Edit' : 'Add'} Contact
        </Button>
      </Form.Item>
    </Form>
  )
}

const ContactList = (props) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [page, setPage] = useState({
    current: 1,
    pageSize: 10,
  });
  const [tableData, setTableData] = useState([]);

  const { get, response, loading } = useFetch();

  const [editingContact, setEditingContact] = useState(null);

  const onEdit = (contact) => () => {
    setIsModalVisible(true);
    setEditingContact(contact);
  }

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    window.location.reload(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingContact(null);
  };

  const fetchList = (page) => {
    get(`/api/v1/contacts/?page=${page}`).then(data => {
      if (response.ok) {
        const newData = data.results.map(audit => ({ ...audit, key: audit.id }));
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
    fetchList(nextPage.current);
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'title',
      render: (text, record) => (
        <Typography.Text>{record.email}</Typography.Text>
      )
    },
    {
      title: 'Name',
      render: (text, record) => (
        <Typography.Text>{record.name}</Typography.Text>
      ),
    },
    {
      title: 'Created',
      render: (text, record) => (
        <Typography.Text>{formatRelativeTime(record.created_at)}</Typography.Text>
      ),
    },
    {
      title: 'Actions',
      render: (text, record) => (
        <Space>
          <Button type="link" onClick={onEdit(record)}> <EditOutlined /> Edit</Button>
          <Button type="link" danger> <DeleteOutlined /> Delete</Button>
        </Space>
      ),
    }
  ];

  return (
    <div>
      <Card title="Contacts" extra={
        <Space>
          <Button icon={<SearchOutlined />}>Search</Button>
          <Button type="primary" onClick={showModal} icon={<PlusOutlined />}>New Contact</Button>
        </Space>

      }>
        <Table
          loading={loading}
          columns={columns}
          dataSource={tableData}
          pagination={page}
          onChange={onChange}
        />
      </Card>
      <Modal title="Contact Details" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel} footer={null} destroyOnClose>
        <ContactForm onComplete={handleOk} editingContact={editingContact} />
      </Modal>
    </div>
  );
};

export default ContactList;