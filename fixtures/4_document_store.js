module.exports = {
  model: 'document_store',
  data: [{
      name: 'Google Drive',
      google_drive_client_id: '87507458445-5dmlifqvfhh39kv5hepl66jgpamu273l.apps.googleusercontent.com',
      google_drive_developer_key: 'AIzaSyDbL2dRzTCEagw9q4LlZ67SDtU0Q_WhBhs',
      google_drive_user_account: 'bitmaker@integration-test-167208.iam.gserviceaccount.com',
      box_client_id: '',
      box_user_account: '',
      server_config_file: '../keys/sample-gdrive-settings.json',
      sftp_host: '',
      sftp_user: '',
      sftp_password: '',
      manager_id: 1,
      document_store_type_id: 1
    },
    {
      name: 'Box',
      google_drive_client_id: '',
      google_drive_developer_key: '',
      google_drive_user_account: '',
      box_client_id: 'agszwl7bw045eetr8ixtfmw14gzc64rp',
      box_user_account: 'ricardo.fernandes@bitmaker-software.com',
      server_config_file: '../keys/sample-box-settings.json',
      sftp_host: '',
      sftp_user: '',
      sftp_password: '',
      manager_id: 1,
      document_store_type_id: 2
    }
  ]
};