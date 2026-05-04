export const DEMO_MESSAGE_TABLE = {
  name: 'DEMO_MESSAGE',
  description: 'OAuth demo 留言登记表',
  cacheFlag: 0,
  columns: [
    {
      name: 'DEMO_ID',
      description: '主键',
      type: 'String',
      totalSize: 36,
      primaryKey: true,
      required: true
    },
    {
      name: 'DEMO_TITLE',
      description: '留言标题',
      type: 'String',
      totalSize: 200,
      required: true
    },
    {
      name: 'DEMO_CONTENT',
      description: '留言内容',
      type: 'Clob',
      required: true
    },
    {
      name: 'DEMO_CREATOR_USERID',
      description: '创建人 userid',
      type: 'String',
      totalSize: 64,
      required: true
    },
    {
      name: 'DEMO_CREATE_TIME',
      description: '创建时间',
      type: 'Date',
      required: true
    },
    {
      name: 'DEMO_UPDATE_TIME',
      description: '更新时间',
      type: 'Date',
      required: true
    }
  ]
};
