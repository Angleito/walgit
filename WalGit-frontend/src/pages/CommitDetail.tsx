import React from 'react';
import { useParams } from 'react-router-dom';

const CommitDetail: React.FC = () => {
  const { owner, name, commitId } = useParams();

  return (
    <div>
      <h1>Commit Detail</h1>
      <p>Repository Owner: {owner}</p>
      <p>Repository Name: {name}</p>
      <p>Commit ID: {commitId}</p>
      {/* TODO: Fetch and display commit details based on commitId */}
    </div>
  );
};

export default CommitDetail; 