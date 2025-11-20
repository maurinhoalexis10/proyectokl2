from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required

# --- CONFIGURACIÓN DE LA APP ---
app = Flask(__name__, static_folder='src/static', template_folder='src/templates')
app.config['SECRET_KEY'] = 'tu_clave_secreta_aqui'  # ¡Cambia esto en un entorno real!
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'
login_manager.login_message = 'Debes iniciar sesión para acceder a esta página.'

# --- MODELOS ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(256))
    
    # IMPORTANTE: ELIMINAMOS 'is_admin'
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    tag = db.Column(db.String(50), default='Plata 925')
    image_file = db.Column(db.String(100), default='default.jpg')
    
    def __repr__(self):
        return f'<Product {self.name}>'

# --- LOADER DE USUARIOS ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- RUTAS DE AUTENTICACIÓN ---

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user is None:
            flash('Usuario no válido. Por favor, revisa el nombre de usuario.', 'danger')
        elif not user.check_password(password):
            flash('Contraseña no válida. Por favor, inténtalo de nuevo.', 'danger')
        else:
            login_user(user, remember=True)
            next_page = request.args.get('next')
            flash(f'¡Bienvenido, {user.username}! Puedes acceder al CRUD de productos.', 'success')
            return redirect(next_page or url_for('index'))
            
    return render_template('login.html', title='Iniciar Sesión')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('El nombre de usuario ya existe. Intenta con otro.', 'danger')
            return redirect(url_for('register'))
        
        new_user = User(username=username)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registro exitoso. ¡Ahora puedes iniciar sesión!', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html', title='Registrarse')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Has cerrado sesión exitosamente.', 'success')
    return redirect(url_for('index'))

# --- RUTAS DE PÁGINA PRINCIPAL Y CRUD DE PRODUCTOS ---

@app.route('/')
def index():
    products = Product.query.all()
    # Usamos index.html que hereda de base.html y recibe la lista de productos
    return render_template('index.html', products=products)

@app.route('/admin')
@login_required
def product_list():
    products = Product.query.all()
    # Usamos la plantilla en la subcarpeta crud/
    return render_template('crud/list.html', products=products)

@app.route('/admin/create', methods=['GET', 'POST'])
@login_required
def product_create():
    if request.method == 'POST':
        name = request.form.get('name')
        description = request.form.get('description')
        price = float(request.form.get('price'))
        tag = request.form.get('tag')
        image_file = request.form.get('image_file')

        new_product = Product(
            name=name,
            description=description,
            price=price,
            tag=tag,
            image_file=image_file
        )
        db.session.add(new_product)
        db.session.commit()
        flash('Producto creado exitosamente.', 'success')
        return redirect(url_for('product_list'))

    return render_template('crud/create.html', title='Crear Producto')

@app.route('/admin/update/<int:product_id>', methods=['GET', 'POST'])
@login_required
def product_update(product_id):
    product = Product.query.get_or_404(product_id)
    
    if request.method == 'POST':
        product.name = request.form.get('name')
        product.description = request.form.get('description')
        product.price = float(request.form.get('price'))
        product.tag = request.form.get('tag')
        product.image_file = request.form.get('image_file')

        db.session.commit()
        flash('Producto actualizado exitosamente.', 'success')
        return redirect(url_for('product_list'))

    return render_template('crud/update.html', product=product, title='Editar Producto')

@app.route('/admin/delete/<int:product_id>', methods=['POST'])
@login_required
def product_delete(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    flash('Producto eliminado exitosamente.', 'success')
    return redirect(url_for('product_list'))

# --- INICIALIZACIÓN ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)