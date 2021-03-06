import { Component, OnInit, OnDestroy } from '@angular/core';
import { UtilsService } from "../../../core/services/utils/utils.service";
import { NumberComponent } from "../number.component";
import { CheckboxComponent } from '../checkbox.component';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Domicilio } from "../../../domain/domicilio";
import { Falta } from "../../../domain/falta";
import { Baneo } from "../../../domain/baneo";
import { Cliente } from "../../../domain/cliente";
import { ButtonListaNegraComponent } from "./button-lista-negra.component";
import { ButtonDetailsComponent } from "./button-details/button-details.component";
import { ClienteService } from "../../../core/services/cliente/cliente.service";
import { ButtonRestoreComponent } from "./button-restore/button-restore.component";
import { ConfirmDeleteDialog } from '../admin-empleados/admin-empleados.component';
import { MatDialog } from '@angular/material';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit, OnDestroy {

  private settings: any;
  private data: any[];
  dataClientes: any[] = [];
  loading: boolean;
  error: boolean;
  clienteSub: Subscription;
  deleteClienteSub: Subscription;
  clientes: Cliente[] = [];
  _MS_PER_DAY = 1000 * 60 * 60 * 24;
  admin: boolean;
  objActions: any;

  constructor(private us: UtilsService, public dialog: MatDialog,private clienteService: ClienteService, private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.initializeGrid();
    let payload = this.authService.getDatosCliente().payload;
    this.admin = (payload.perfil === "Administrador") ? true : false;
    if(this.admin) {
      this.objActions = {
        add: false, edit: false, delete: false, position: 'right', 
        custom:
          [
            { name: 'editar', title: `<i class="fa fa-edit" aria-hidden="true" title="Editar"></i><br>` },
            { name: 'eliminar', title: `<i class="fa fa-trash-o" aria-hidden="true" title="Eliminar"></i>` }
          ]
      }
    } else {
      this.objActions = false;
    }
    this.settings = {
      actions: this.objActions,
      columns: {
        nombre: {
          title: 'Nombre'

        },
        email: {
          title: 'Email'

        },
        telefono: {
          title: 'telefono',
          type: 'custom',
          renderComponent: NumberComponent
        },
        dni: {
          title: 'Dni',
          type: 'custom',
          renderComponent: NumberComponent
        },
        faltas: {
          title: "Faltas Recientes"
        },
        baneado: {
          title: "Baneado"
        },
        listanegra: {
          title: "Lista Negra",
          type: 'custom',
          renderComponent: ButtonListaNegraComponent,
          show: this.admin
        },
        restaurar: {
          title: "Restaurar",
          type: 'custom',
          renderComponent: ButtonRestoreComponent,
          show: this.admin
        },
        detalle: {
          title: "Detelle",
          type: 'custom',
          renderComponent: ButtonDetailsComponent
        }
      },
      defaultStyle: true,
      attr: {
        class: 'table table-bordered table-striped'
      }
    }
  }

  initializeGrid() {
    this.loading = true;
    this.clientes = [];
    this.dataClientes = [];
    this.clienteSub = this.clienteService.getClientes$()
      .subscribe(dataClientes => {
        dataClientes.forEach(c => {
          console.log(c);
          this.clientes.push(c);
          let faltasRecientes;
          let estaBaneado;
          let diasDeDiferencia;
          if(c.faltas) {
            //diasDeDiferencia = this.dateDiffInDays(new Date(), c.faltas.fecha_hasta);
            c.faltas.forEach(f => {
              diasDeDiferencia = this.dateDiffInDays(new Date(), new Date(f.fecha_hasta.toString()));
              console.log("Dias de diferencia ", diasDeDiferencia);
              if(diasDeDiferencia > 0) {
                faltasRecientes = "Si";
              }
            });
            
          }
          if(c.baneos) {
            c.baneos.forEach(b => {
              if(b.vigente) {
                estaBaneado = "Si";
              }
            });
          }
          this.dataClientes.push({
            nombre: c.nombre,
            email: c.email,
            telefono: c.telefono,
            dni: c.dni,
            faltas: (faltasRecientes) ? faltasRecientes : "No",
            baneado: (estaBaneado) ? estaBaneado : "No",
            listanegra: c,
            restaurar: c,
            detalle: c
          });
        });
        this.fillData();
      }, err => {
        console.error(err);
        this.loading = false;
        this.error = true;
      });
  }

  fillData() {
    this.data = this.dataClientes;
    this.loading = false;
  }

  dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  
    return Math.floor((utc2 - utc1) / this._MS_PER_DAY);
  }
  onCustom(event){
    if(`'${event.action}'` == "'editar'"){
    this.clientes.forEach(c => {
      if(c.dni == event.data.dni) {
        this.us.cliente = c;
        this.router.navigate(['admin-usuarios-form']);
      }
    });
    }else{
      let dialogRef = this.dialog.open(ConfirmDeleteDialog, {
        width: '300px'
      });
      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
        if(result == "Confirmado") {
          this.clientes.forEach(c => {
            if(c.email == event.data.email) {
              this.deleteClienteSub = this.clienteService.deleteCliente$(c._id)
                .subscribe(
                  data => {
                    this.initializeGrid();
                  },
                  err => {
                    console.error(err);
                    this.loading = false;
                    this.error = true;
                  });
            }
          });
        }
      });
    }
  }

  ngOnDestroy() {
    this.clienteSub.unsubscribe();
  }

}
