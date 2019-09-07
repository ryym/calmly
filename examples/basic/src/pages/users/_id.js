import React from 'react';

const User = ({ id, name }) => {
  return (
    <div>
      <h1>Hello, {name}</h1>
      <p>Your ID is {id}</p>
    </div>
  );
};

export default User;

export const getInitialPropsMap = async () => {
  const users = await fetchUsers();
  const entries = users.map(u => [u.id, u]);
  return new Map(entries);
};

const fetchUsers = async () => {
  return [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Carol' }];
};
