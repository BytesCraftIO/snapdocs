// MongoDB initialization script for production
db = db.getSiblingDB('snapdocs');

// Create application user with limited privileges
db.createUser({
  user: 'snapdocs_user',
  pwd: process.env.MONGO_PASSWORD || 'changeme',
  roles: [
    {
      role: 'readWrite',
      db: 'snapdocs'
    }
  ]
});

// Create collections with schema validation
db.createCollection('pages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['pageId', 'content', 'version'],
      properties: {
        pageId: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        content: {
          bsonType: 'object',
          description: 'must be an object and is required'
        },
        version: {
          bsonType: 'int',
          minimum: 1,
          description: 'must be an integer greater than 0 and is required'
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('page_versions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['pageId', 'version', 'content', 'createdAt'],
      properties: {
        pageId: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        version: {
          bsonType: 'int',
          minimum: 1,
          description: 'must be an integer greater than 0 and is required'
        },
        content: {
          bsonType: 'object',
          description: 'must be an object and is required'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date and is required'
        }
      }
    }
  }
});

db.createCollection('templates');
db.createCollection('collaborative_sessions');

// Create indexes for better performance
db.pages.createIndex({ pageId: 1 }, { unique: true });
db.pages.createIndex({ 'content.blocks.id': 1 });
db.pages.createIndex({ updatedAt: -1 });

db.page_versions.createIndex({ pageId: 1, version: 1 }, { unique: true });
db.page_versions.createIndex({ pageId: 1, createdAt: -1 });

db.templates.createIndex({ name: 1 });
db.templates.createIndex({ category: 1 });

db.collaborative_sessions.createIndex({ pageId: 1 });
db.collaborative_sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Expire after 24 hours

print('MongoDB production initialization completed successfully');