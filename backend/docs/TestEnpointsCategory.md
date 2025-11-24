# 1. Create a category
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Fresh Fruits", "type": "FOOD"}'

# 2. Get all categories
curl http://localhost:3000/api/categories

# 3. Get categories filtered by type
curl "http://localhost:3000/api/categories?type=FOOD"

# 4. Get specific category (replace {id} with actual UUID)
curl http://localhost:3000/api/categories/{id}

# 5. Update category
curl -X PUT http://localhost:3000/api/categories/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Organic Fruits"}'

# 6. Get statistics
curl http://localhost:3000/api/categories/stats

# 7. Delete category
curl -X DELETE http://localhost:3000/api/categories/{id}

# 8. Health check
curl http://localhost:3000/health