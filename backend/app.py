from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# 数据存储路径
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# 游戏指南数据结构
game_guide = {
    "game_mechanics": {
        "title": "游戏机制",
        "content": "详细的游戏机制说明...",
        "sections": [
            "职业",
            "负面状态",
            "抗性",
            "基础属性",
            "性格系统",
            "装备系统",
            "入梦系统"
        ]
    },
    "feedback": {
        "title": "意见征集",
        "content": "欢迎提供游戏相关建议...",
        "sections": [
            "职业意见",
            "怪物意见",
            "BOSS意见"
        ]
    },
    "game_guide": {
        "title": "游戏攻略",
        "content": "详细的游戏攻略...",
        "sections": [
            "职业",
            "灵具",
            "饰品",
            "梦灵",
            "怪物",
            "BOSS",
            "阵容推荐",
            "性格",
            "版本更新"
        ]
    }
}

# 用户设置和历史记录
def load_user_data(user_id='default'):
    try:
        with open(f'{DATA_DIR}/user_{user_id}.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            'theme': 'light',
            'search_history': [],
            'navigation_history': []
        }

def save_user_data(data, user_id='default'):
    with open(f'{DATA_DIR}/user_{user_id}.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 添加评论数据结构
comments_data = {
    'game_mechanics': {
        '职业': [
            {
                'id': 1,
                'user': 'user1',
                'content': '战士职业非常适合新手...',
                'timestamp': '2024-03-20 10:00:00',
                'likes': 5
            }
        ]
    }
}

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/guide', methods=['GET'])
def get_guide():
    return jsonify(game_guide)

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify(game_guide)
    
    filtered_data = {}
    for key, section in game_guide.items():
        if (query in section['title'].lower() or 
            any(query in item.lower() for item in section['sections'])):
            filtered_data[key] = section
    
    # 保存搜索历史
    user_data = load_user_data()
    if query not in user_data['search_history']:
        user_data['search_history'].append(query)
        user_data['search_history'] = user_data['search_history'][-10:]  # 保留最近10条
        save_user_data(user_data)
    
    return jsonify(filtered_data)

@app.route('/api/user/settings', methods=['GET', 'PUT'])
def handle_user_settings():
    user_data = load_user_data()
    
    if request.method == 'GET':
        return jsonify(user_data)
    
    if request.method == 'PUT':
        new_settings = request.json
        user_data.update(new_settings)
        save_user_data(user_data)
        return jsonify({'status': 'success'})

@app.route('/api/user/search-history', methods=['GET', 'DELETE'])
def handle_search_history():
    user_data = load_user_data()
    
    if request.method == 'GET':
        return jsonify(user_data['search_history'])
    
    if request.method == 'DELETE':
        user_data['search_history'] = []
        save_user_data(user_data)
        return jsonify({'status': 'success'})

@app.route('/api/user/navigation', methods=['POST'])
def save_navigation():
    user_data = load_user_data()
    navigation = request.json
    
    user_data['navigation_history'].append({
        'path': navigation['path'],
        'timestamp': datetime.now().isoformat()
    })
    user_data['navigation_history'] = user_data['navigation_history'][-20:]  # 保留最近20条
    save_user_data(user_data)
    
    return jsonify({'status': 'success'})

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    feedback = request.json
    # 保存反馈到文件
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    with open(f'{DATA_DIR}/feedback_{timestamp}.json', 'w', encoding='utf-8') as f:
        json.dump(feedback, f, ensure_ascii=False, indent=2)
    return jsonify({"status": "success"})

# 添加新的API路由
@app.route('/api/comments/<section>/<topic>', methods=['GET'])
def get_comments(section, topic):
    """获取指定部分和主题的评论"""
    comments = comments_data.get(section, {}).get(topic, [])
    return jsonify(comments)

@app.route('/api/comments/<section>/<topic>', methods=['POST'])
def add_comment(section, topic):
    """添加新评论"""
    comment = request.json
    if section not in comments_data:
        comments_data[section] = {}
    if topic not in comments_data[section]:
        comments_data[section][topic] = []
    
    # 添加评论ID和时间戳
    comment['id'] = len(comments_data[section][topic]) + 1
    comment['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    comment['likes'] = 0
    
    comments_data[section][topic].append(comment)
    return jsonify({'status': 'success', 'comment': comment})

@app.route('/api/comments/<section>/<topic>/<int:comment_id>/like', methods=['POST'])
def like_comment(section, topic, comment_id):
    """点赞评论"""
    comments = comments_data.get(section, {}).get(topic, [])
    for comment in comments:
        if comment['id'] == comment_id:
            comment['likes'] += 1
            return jsonify({'status': 'success', 'likes': comment['likes']})
    return jsonify({'status': 'error', 'message': '评论不存在'}), 404

if __name__ == '__main__':
    app.run(debug=True) 