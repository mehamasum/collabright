import React, { useState } from 'react';
import { Select } from 'antd';
import useFetch from 'use-http';

const { Option } = Select;

const SearchAuditor = ({ className, onChange, reviewers }) => {
  const [data, setData] = useState([]);
  const [value, setValue] = useState(undefined);
  const { get, post, patch, response } = useFetch();

  const getData = (searchText, onSuccess) => {
    console.log('getting');
    get(`/api/v1/contacts/?search=${searchText}`)
    .then(result => {
      if (response.ok) {
        console.log('got', result);
        onSuccess(result.results);
      }
      console.error(result);
    })
  }

  const handleSearch = searchText => {
    console.log('searching', searchText);
    if (searchText) {
      getData(searchText, data => setData(data));
    } else {
      setData([]);
    }
  };

  const handleChange = value => {
    console.log('handleChange', value);
    setValue(value);
    onChange(value);
  };

  const options = data.map(d => <Option key={d.email}>{d.email}</Option>);
  return (
    <Select
      className={className}
      mode="tags" 
      showSearch
      defaultValue={reviewers}
      value={value}
      placeholder="Search with email"
      defaultActiveFirstOption={false}
      showArrow={false}
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      notFoundContent={null}
    >
      {options}
    </Select>
  ); 
};

export default SearchAuditor;