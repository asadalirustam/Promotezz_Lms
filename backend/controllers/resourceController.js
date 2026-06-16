const Resource = require('../models/Resource');
const Course = require('../models/Course');
const fs = require('fs');
const path = require('path');

// @desc    Upload course resource (PDF, dataset, or URL link)
// @route   POST /api/resources
// @access  Private (Teacher/Admin/HOD)
const uploadResource = async (req, res) => {
  try {
    const { title, description, type, courseId, externalUrl } = req.body;

    if (!title || !type || !courseId) {
      return res.status(400).json({ success: false, message: 'Please provide title, type, and course ID' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Auth check: If teacher, verify course ownership
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized for this course' });
    }

    let url = '';
    
    if (req.file) {
      url = `/uploads/${req.file.filename}`;
    } else if (externalUrl) {
      url = externalUrl;
    } else {
      return res.status(400).json({ success: false, message: 'Please upload a file or specify an external link URL' });
    }

    const resource = await Resource.create({
      title,
      description,
      type,
      url,
      course: courseId,
      uploadedBy: req.user.id
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get resources for a course
// @route   GET /api/resources/course/:courseId
// @access  Private
const getCourseResources = async (req, res) => {
  try {
    const resources = await Resource.find({ course: req.params.courseId })
      .populate('uploadedBy', 'name role');
    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a course resource
// @route   DELETE /api/resources/:id
// @access  Private (Teacher/Admin/HOD)
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Auth check: Admin/HOD can delete any, Teacher can delete their own
    if (req.user.role === 'teacher' && resource.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this resource' });
    }

    // Clean up file on disk if it is local
    if (resource.url.startsWith('/uploads/')) {
      const filename = resource.url.replace('/uploads/', '');
      const filePath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await resource.deleteOne();
    res.status(200).json({ success: true, message: 'Resource removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all resources across all courses
// @route   GET /api/resources
// @access  Private
const getResources = async (req, res) => {
  try {
    const resources = await Resource.find({})
      .populate('course', 'name code')
      .populate('uploadedBy', 'name role');
    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadResource,
  getCourseResources,
  deleteResource,
  getResources
};

