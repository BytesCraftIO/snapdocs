// MongoDB initialization script
db = db.getSiblingDB('snapdocs');

// Create user for the application
db.createUser({
  user: 'snapdocs_user',
  pwd: 'snapdocs_password',
  roles: [
    {
      role: 'readWrite',
      db: 'snapdocs'
    }
  ]
});

// Create collections with validation
db.createCollection('pages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['pageId', 'content', 'version', 'createdAt', 'updatedAt'],
      properties: {
        pageId: {
          bsonType: 'string',
          description: 'Must be a string and is required'
        },
        content: {
          bsonType: 'object',
          description: 'Page content blocks'
        },
        version: {
          bsonType: 'int',
          minimum: 1,
          description: 'Version number must be an integer >= 1'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Must be a date'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Must be a date'
        }
      }
    }
  }
});

db.createCollection('page_history', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['pageId', 'version', 'content', 'changedBy', 'changedAt'],
      properties: {
        pageId: {
          bsonType: 'string'
        },
        version: {
          bsonType: 'int',
          minimum: 1
        },
        content: {
          bsonType: 'object'
        },
        changedBy: {
          bsonType: 'string'
        },
        changedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('templates');

// Create indexes for better performance
db.pages.createIndex({ pageId: 1 }, { unique: true });
db.pages.createIndex({ updatedAt: -1 });
db.page_history.createIndex({ pageId: 1, version: -1 });
db.page_history.createIndex({ changedAt: -1 });

print('MongoDB initialization completed successfully!');