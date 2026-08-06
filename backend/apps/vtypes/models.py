from django.db import models

class VType(models.Model):
    vtype = models.CharField(max_length=5, primary_key=True, db_column='vtype')
    vtype_description = models.CharField(max_length=50, unique=True, db_column='vtype_description')

    class Meta:
        db_table = 'vtypes'
        verbose_name = 'Voucher Type'
        verbose_name_plural = 'Voucher Types'

    def __str__(self):
        return f"{self.vtype} - {self.vtype_description}"