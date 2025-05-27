import fs from 'fs';
import path from 'path';

// Simple file-based storage for development when MongoDB is not available
const dbPath = path.join(process.cwd(), 'data');
const usersFile = path.join(dbPath, 'users.json');
const imagesFile = path.join(dbPath, 'images.json');

// Ensure data directory exists
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([]));
}

if (!fs.existsSync(imagesFile)) {
  fs.writeFileSync(imagesFile, JSON.stringify([]));
}

export const localDB = {
  users: {
    find: (query: any = {}) => {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      if (Object.keys(query).length === 0) return users;
      return users.filter((user: any) => {
        return Object.keys(query).every(key => user[key] === query[key]);
      });
    },
    
    findOne: (query: any) => {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      return users.find((user: any) => {
        return Object.keys(query).every(key => user[key] === query[key]);
      });
    },
    
    create: (userData: any) => {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      const newUser = {
        _id: Date.now().toString(),
        ...userData,
        createdAt: new Date()
      };
      users.push(newUser);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      return newUser;
    }
  },
  
  images: {
    find: (query: any = {}) => {
      const images = JSON.parse(fs.readFileSync(imagesFile, 'utf8'));
      if (Object.keys(query).length === 0) return images;
      return images.filter((image: any) => {
        return Object.keys(query).every(key => {
          if (key.includes('.')) {
            // Handle nested queries like 'options.type'
            const [parent, child] = key.split('.');
            return image[parent] && image[parent].some((item: any) => item[child] === query[key]);
          }
          return image[key] === query[key];
        });
      });
    },
    
    findById: (id: string) => {
      const images = JSON.parse(fs.readFileSync(imagesFile, 'utf8'));
      return images.find((image: any) => image._id === id);
    },
    
    create: (imageData: any) => {
      const images = JSON.parse(fs.readFileSync(imagesFile, 'utf8'));
      const newImage = {
        _id: Date.now().toString(),
        ...imageData,
        uploadDate: new Date()
      };
      images.push(newImage);
      fs.writeFileSync(imagesFile, JSON.stringify(images, null, 2));
      return newImage;
    },
    
    updateById: (id: string, updateData: any) => {
      const images = JSON.parse(fs.readFileSync(imagesFile, 'utf8'));
      const index = images.findIndex((image: any) => image._id === id);
      if (index !== -1) {
        images[index] = { ...images[index], ...updateData };
        fs.writeFileSync(imagesFile, JSON.stringify(images, null, 2));
        return images[index];
      }
      return null;
    },
    
    deleteById: (id: string) => {
      const images = JSON.parse(fs.readFileSync(imagesFile, 'utf8'));
      const index = images.findIndex((image: any) => image._id === id);
      if (index !== -1) {
        const deleted = images.splice(index, 1)[0];
        fs.writeFileSync(imagesFile, JSON.stringify(images, null, 2));
        return deleted;
      }
      return null;
    },
    
    countDocuments: (query: any = {}) => {
      return localDB.images.find(query).length;
    }
  }
};

console.log('📁 Using local file-based database for development');
console.log(`📂 Data directory: ${dbPath}`);
