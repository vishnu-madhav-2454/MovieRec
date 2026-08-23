import PersonModel from '../models/personModel.js';

class PersonController {
  static async getDetails(req, res) {
    try {
      const { id } = req.params;
      const data = await PersonModel.getDetails(id);
      res.json(data);
    } catch (error) {
      console.error('Error in PersonController.getDetails:', error.message);
      res.status(500).json({ error: 'Failed to fetch person details' });
    }
  }
}

export default PersonController;
