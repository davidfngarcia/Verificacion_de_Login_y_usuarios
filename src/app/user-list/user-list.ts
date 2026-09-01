import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { CrearUsuarioComponent } from '../crear-usuario/crear-usuario';


interface Usuario {
  id: number;
  nombre: string;
  username: string;
  correo: string;
}

interface UsuariosResponse {
  data: Usuario[];
  total: number;
  page: number;
  totalPages: number;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, NgbPaginationModule],
  templateUrl: './user-list.html',
})
export class UserListComponent implements OnInit {
  usuarios: Usuario[] = [];
  errorMessage = '';
  loading = true;

  // Variables para la paginación
  paginaActual = 1;
  totalUsuarios = 0;
  usuariosPorPagina = 5;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef
  ) { }

  abrirModalCrearUsuario(): void {
    const modalRef = this.modalService.open(CrearUsuarioComponent, { animation: false });;

    modalRef.result.then(
      (resultado) => {
        if (resultado === 'creado') {
          this.paginaActual = 1; // volvemos a la primera página para ver el nuevo usuario
          this.cargarUsuarios();
        }
      },
      () => {
        // el usuario canceló el modal, no hacemos nada
      }
    );
  }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

 cargarUsuarios(): void {
  this.loading = true;
  this.errorMessage = '';

  const params = new HttpParams()
    .set('page', this.paginaActual)
    .set('limit', this.usuariosPorPagina);

  this.http
    .get<UsuariosResponse>(`${environment.apiUrl}/api/usuarios`, { params })
    .subscribe({
      next: (res) => {
        this.usuarios = res.data;
        this.totalUsuarios = res.total;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.status === 404 ? 'No Data Found' : 'Error al cargar usuarios';
        this.cdr.detectChanges();
      },
    });
}

  cambiarPagina(nuevaPagina: number): void {
    this.paginaActual = nuevaPagina;
    this.cargarUsuarios();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']), // aunque falle la llamada, cerramos localmente
    });
  }
}