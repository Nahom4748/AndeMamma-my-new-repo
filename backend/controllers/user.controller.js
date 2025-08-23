const userService = require('../services/user.service');
async function CreateUser(req, res) {
  try {
    const userData = req.body;
    console.log(userData)
    // Check if email already exists
    const existingUser = await userService.findUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already exists',
      });
    }

    // Proceed to create new user
    const newUser = await userService.createUser(userData);

    res.status(201).json({
      status: 'success',
      data: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}

async function Users(req, res) {
  try {
    const users = await userService.getUsers();
    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
async function CompanyRoles(req, res) {
  try {
    const roles = await userService.getCompanyRoles();
    res.status(200).json({
      status: 'success',
      data: roles,
    });
  } catch (error) {
    console.error('Error retrieving company roles:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
 async function UpdateUser(req, res) {
  try {
    const userId = req.params.id;
    const userData = req.body;

    if (!userId || !userData) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID and data are required',
      });
    }

    const updatedUser = await userService.UpdateUser(userId, userData);
    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}
async function DeleteUser(req, res) {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required',
      });
    }

    await userService.deleteUser(userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
}
async function GetMarketors(req, res) {
  try {
    const marketors = await userService.getMarketors();
    res.status(200).json({
      status: 'success',
      data: marketors,
    });
  } catch (error) {
    console.error('Error retrieving marketors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function createmamas(req,res){
try {
    const mama = await userService.createMammas(req.body);
    res.json({ status: "success", data: mama });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


async function getAllMammas(req, res) {
  try {
 
    const mamas = await userService.getAllMammas();
     res.status(200).json({
      status: 'success',
      data: mamas,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function udateMammas(req, res) {
  try {
    const response = await userService.updateMamas(req.params.id, req.body);
    res.json({ status: "success", data: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteMammas(req, res) {
  try {
    await userService.deleteMember(req.params.id);
  
        res.json({ status: "success", message: "Mama deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  CreateUser,
  Users,
  CompanyRoles,
  UpdateUser,
  DeleteUser,
  GetMarketors,createmamas,getAllMammas,udateMammas,deleteMammas
};