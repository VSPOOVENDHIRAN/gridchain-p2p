const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },   
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },               
  phone: { type: String, required: true, unique: true },     
  meter_id: { type: String, required: true, unique: true, index: true },
  transformer_id: { type: String, required: true, trim: true },   
  grid_id: { type: String, required: true },                     
  wallet_address: { type: String, unique: true, sparse: true },        
  energy_balance: { type: Number, default: 0 }, 
  reserved_energy: { type: Number, default: 0 },
  token_balance: { type: Number, default: 0 },
  reserved_tokens: { type: Number, default: 0 }, 
  total_energy_sold:    { type: Number, default: 0 },         
  total_energy_bought:  { type: Number, default: 0 },        
  total_imported_energy: { type: Number, default: 0 },         
  total_exported_energy: { type: Number, default: 0 },
  last_import_reading:   { type: Number, default: 0 },         
  last_export_reading:   { type: Number, default: 0 },
  last_login: { type: Date },
  created_at: { type: Date, default: Date.now }
});


module.exports = mongoose.model("User", userSchema, "users");