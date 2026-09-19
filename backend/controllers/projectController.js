import Project from '../models/Project.js';

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const projects = await Project.find({ user: userId })
      .sort({ updatedAt: -1 })
      .select('-assets -devices -background -text -logo -decoration -decos -icons -textboxes -canvasImages');

    res.json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const project = await Project.findOne({ 
      _id: projectId, 
      user: userId 
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectData = req.body;

    // Add user to project
    projectData.user = userId;

    const project = await Project.create(projectData);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const updateData = req.body;

    // Ensure user owns the project
    let project = await Project.findOne({ 
      _id: projectId, 
      user: userId 
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update project
    project = await Project.findByIdAndUpdate(
      projectId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating project'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const project = await Project.findOne({ 
      _id: projectId, 
      user: userId 
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await Project.findByIdAndDelete(projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project'
    });
  }
};

// @desc    Duplicate project
// @route   POST /api/projects/:id/duplicate
// @access  Private
export const duplicateProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const originalProject = await Project.findOne({ 
      _id: projectId, 
      user: userId 
    });

    if (!originalProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create duplicate
    const duplicateData = originalProject.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    
    duplicateData.name = `${originalProject.name} (Copy)`;
    duplicateData.user = userId;

    const duplicateProject = await Project.create(duplicateData);

    res.status(201).json({
      success: true,
      message: 'Project duplicated successfully',
      project: duplicateProject
    });
  } catch (error) {
    console.error('Duplicate project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while duplicating project'
    });
  }
};

// @desc    Update project thumbnail
// @route   PUT /api/projects/:id/thumbnail
// @access  Private
export const updateThumbnail = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { thumbnail } = req.body;

    const project = await Project.findOne({ 
      _id: projectId, 
      user: userId 
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.thumbnail = thumbnail;
    await project.save();

    res.json({
      success: true,
      message: 'Thumbnail updated successfully'
    });
  } catch (error) {
    console.error('Update thumbnail error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating thumbnail'
    });
  }
};

// @desc    Increment export count
// @route   PUT /api/projects/:id/export
// @access  Private
export const incrementExport = async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    const project = await Project.findOne({ 
      _id: projectId, 
      user: userId 
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.exportCount += 1;
    await project.save();

    res.json({
      success: true,
      message: 'Export count updated',
      exportCount: project.exportCount
    });
  } catch (error) {
    console.error('Increment export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating export count'
    });
  }
};
