//------------------------Libraries-----------//
const express = require('express');
const axios = require('axios');
const lodash = require('lodash');

const app = express();
const port = 3000;
//----------------------------------------------//



//============== Functions====================//
// Function to fetch blog data
const fetchBlogData = async () => {
  try {
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });
    return response.data.blogs;
  } catch (error) {
    throw new Error('Failed to fetch blog data');
  }
};

// Memoized version of the fetchBlogData function
const memoizedFetchBlogData = lodash.memoize(fetchBlogData, () => 'cache-key');
//===========================================================================//


//========================== Routes ============================//
// Middleware to fetch blog data
app.get('/api/blog-stats', async (req, res, next) => {
  // Fetch and memoize blog data
  try {
    const blogs = await memoizedFetchBlogData();
    req.blogs = blogs;
    next();
  } catch (error) {
  
    res.status(500).json({ error: 'Failed to fetch blog data' });
  }
});

// Middleware to analyze blog statistics
app.use('/api/blog-stats', (req, res, next) => {

  const blogs = req.blogs || [];

  // Perform analytics using Lodash
  const totalBlogs = blogs.length;
  const blogWithLongestTitle = totalBlogs > 0 ? lodash.maxBy(blogs, blog => blog.title.length) : null;
  const blogsWithPrivacyTitle = lodash.filter(blogs, blog =>
    blog.title.toLowerCase().includes('privacy')
  );
  const numBlogsWithPrivacyTitle = blogsWithPrivacyTitle.length;
  const uniqueBlogTitles = lodash.uniqBy(blogs, 'title').map(blog => blog.title);

  req.blogStats = {
    totalBlogs,
    blogWithLongestTitle,
    numBlogsWithPrivacyTitle,
    uniqueBlogTitles,
  };

  next(); // Move to the next middleware or route handler
});

// Route to get blog statistics
app.get('/api/blog-stats', (req, res) => {

  const blogStats = req.blogStats;


  res.json({
    totalBlogs: blogStats.totalBlogs,
    longestBlogTitle: blogStats.blogWithLongestTitle ? blogStats.blogWithLongestTitle.title : null,
    numBlogsWithPrivacyTitle: blogStats.numBlogsWithPrivacyTitle,
    uniqueBlogTitles: blogStats.uniqueBlogTitles,
  });
});

// Route for blog search
app.get('/api/blog-search', (req, res) => {

  const query = req.query.query || '';

  // Implement search logic
  const searchResults = lodash.filter(req.blogs, blog =>
    blog.title.toLowerCase().includes(query.toLowerCase())
  );


  res.json({ searchResults });
});

// Error handling middleware
app.use((err, req, res, next) => {

  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
//============================= End ============================//