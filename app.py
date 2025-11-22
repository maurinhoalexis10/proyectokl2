from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os

app = Flask(__name__)  # ← Sin src/ porque moviste las carpetas
app.config['SECRET_KEY'] = 'tu_clave_secreta_super_segura_2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///joyeria.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ==================== MODELOS DE BASE DE DATOS ====================

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    es_admin = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Usuario {self.email}>'


class Producto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    precio = db.Column(db.Integer, nullable=False)
    tag = db.Column(db.String(50), default='Plata 925')
    imagen = db.Column(db.String(200), default='default.jpg')
    
    def __repr__(self):
        return f'<Producto {self.nombre}>'


# ==================== DECORADOR PARA RUTAS PROTEGIDAS ====================

def login_requerido(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario_id' not in session:
            flash('Por favor inicia sesión para acceder', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def admin_requerido(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario_id' not in session:
            flash('Por favor inicia sesión', 'warning')
            return redirect(url_for('login'))
        
        usuario = Usuario.query.get(session['usuario_id'])
        if not usuario or not usuario.es_admin:
            flash('No tienes permisos de administrador', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function


# ==================== RUTAS DE AUTENTICACIÓN ====================

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        usuario = Usuario.query.filter_by(email=email).first()
        
        if usuario and check_password_hash(usuario.password, password):
            session['usuario_id'] = usuario.id
            session['usuario_nombre'] = usuario.nombre
            session['es_admin'] = usuario.es_admin
            flash(f'¡Bienvenido {usuario.nombre}!', 'success')
            
            if usuario.es_admin:
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('index'))
        else:
            flash('Email o contraseña incorrectos', 'danger')
    
    return render_template('login.html')


@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        email = request.form.get('email')
        password = request.form.get('password')
        confirmar = request.form.get('confirmar_password')
        
        # Validaciones
        if Usuario.query.filter_by(email=email).first():
            flash('Este email ya está registrado', 'danger')
            return redirect(url_for('registro'))
        
        if password != confirmar:
            flash('Las contraseñas no coinciden', 'danger')
            return redirect(url_for('registro'))
        
        if len(password) < 6:
            flash('La contraseña debe tener al menos 6 caracteres', 'danger')
            return redirect(url_for('registro'))
        
        # Crear usuario
        nuevo_usuario = Usuario(
            nombre=nombre,
            email=email,
            password=generate_password_hash(password)
        )
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        flash('¡Registro exitoso! Ahora puedes iniciar sesión', 'success')
        return redirect(url_for('login'))
    
    return render_template('registro.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('Sesión cerrada exitosamente', 'info')
    return redirect(url_for('login'))


# ==================== RUTAS PRINCIPALES ====================

@app.route('/')
@login_requerido
def index():
    productos = Producto.query.all()
    return render_template('index.html', productos=productos)


# ==================== PANEL DE ADMINISTRACIÓN ====================

@app.route('/admin')
@admin_requerido
def admin_dashboard():
    productos = Producto.query.all()
    usuarios = Usuario.query.all()
    return render_template('admin/dashboard.html', productos=productos, usuarios=usuarios)


# ==================== CRUD DE PRODUCTOS ====================

@app.route('/admin/productos')
@admin_requerido
def admin_productos():
    productos = Producto.query.all()
    return render_template('admin/productos.html', productos=productos)


@app.route('/admin/productos/crear', methods=['GET', 'POST'])
@admin_requerido
def crear_producto():
    if request.method == 'POST':
        nombre = request.form.get('nombre')
        descripcion = request.form.get('descripcion')
        precio = int(request.form.get('precio'))
        tag = request.form.get('tag', 'Plata 925')
        imagen = request.form.get('imagen', 'default.jpg')
        
        nuevo_producto = Producto(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            tag=tag,
            imagen=imagen
        )
        
        db.session.add(nuevo_producto)
        db.session.commit()
        
        flash('Producto creado exitosamente', 'success')
        return redirect(url_for('admin_productos'))
    
    return render_template('admin/crear_producto.html')


@app.route('/admin/productos/editar/<int:id>', methods=['GET', 'POST'])
@admin_requerido
def editar_producto(id):
    producto = Producto.query.get_or_404(id)
    
    if request.method == 'POST':
        producto.nombre = request.form.get('nombre')
        producto.descripcion = request.form.get('descripcion')
        producto.precio = int(request.form.get('precio'))
        producto.tag = request.form.get('tag')
        producto.imagen = request.form.get('imagen')
        
        db.session.commit()
        
        flash('Producto actualizado exitosamente', 'success')
        return redirect(url_for('admin_productos'))
    
    return render_template('admin/editar_producto.html', producto=producto)


@app.route('/admin/productos/eliminar/<int:id>')
@admin_requerido
def eliminar_producto(id):
    producto = Producto.query.get_or_404(id)
    db.session.delete(producto)
    db.session.commit()
    
    flash('Producto eliminado exitosamente', 'success')
    return redirect(url_for('admin_productos'))


# ==================== GESTIÓN DE USUARIOS ====================

@app.route('/admin/usuarios')
@admin_requerido
def admin_usuarios():
    usuarios = Usuario.query.all()
    return render_template('admin/usuarios.html', usuarios=usuarios)


@app.route('/admin/usuarios/hacer-admin/<int:id>')
@admin_requerido
def hacer_admin(id):
    usuario = Usuario.query.get_or_404(id)
    usuario.es_admin = True
    db.session.commit()
    
    flash(f'{usuario.nombre} ahora es administrador', 'success')
    return redirect(url_for('admin_usuarios'))


@app.route('/admin/usuarios/quitar-admin/<int:id>')
@admin_requerido
def quitar_admin(id):
    usuario = Usuario.query.get_or_404(id)
    usuario.es_admin = False
    db.session.commit()
    
    flash(f'Se removieron los permisos de administrador a {usuario.nombre}', 'info')
    return redirect(url_for('admin_usuarios'))


@app.route('/admin/usuarios/eliminar/<int:id>')
@admin_requerido
def eliminar_usuario(id):
    if id == session.get('usuario_id'):
        flash('No puedes eliminarte a ti mismo', 'danger')
        return redirect(url_for('admin_usuarios'))
    
    usuario = Usuario.query.get_or_404(id)
    db.session.delete(usuario)
    db.session.commit()
    
    flash('Usuario eliminado exitosamente', 'success')
    return redirect(url_for('admin_usuarios'))


# ==================== INICIALIZACIÓN ====================

def crear_admin_inicial():
    """Crea un usuario administrador inicial si no existe"""
    admin = Usuario.query.filter_by(email='admin@joyeria.com').first()
    if not admin:
        admin = Usuario(
            nombre='Administrador',
            email='admin@joyeria.com',
            password=generate_password_hash('admin123'),
            es_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print('✅ Usuario administrador creado:')
        print('   Email: admin@joyeria.com')
        print('   Contraseña: admin123')


def crear_productos_iniciales():
    """Crea productos de ejemplo si no existen"""
    if Producto.query.count() == 0:
        productos = [
            Producto(
                nombre='Collar de Plata',
                descripcion='Elegante collar artesanal en plata italiana 925, diseño minimalista perfecto para cualquier ocasión.',
                precio=8000,
                tag='Plata 925',
                imagen='joya1.jpg'
            ),
            Producto(
                nombre='Collar Dorado',
                descripcion='Sofisticado collar con baño de oro sobre plata 925, brillo excepcional y terminación impecable.',
                precio=8000,
                tag='Plata 925',
                imagen='joya2.jpg'
            ),
            Producto(
                nombre='Aros Rojos',
                descripcion='Delicados aros con detalles en rojo, combinación perfecta de color y elegancia en plata italiana.',
                precio=5000,
                tag='Plata 925',
                imagen='joya3.jpg'
            )
        ]
        
        for producto in productos:
            db.session.add(producto)
        
        db.session.commit()
        print('✅ Productos de ejemplo creados')


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        crear_admin_inicial()
        crear_productos_iniciales()
    
    app.run(debug=True)